# OVR Helm chart

Deploys the OVR web app and worker to Kubernetes. Requires a Postgres database,
a Redis-compatible instance, and an S3-compatible bucket already running
somewhere reachable from the cluster — this chart does not provision them.

## 1. Set required values

Copy `values.yaml`, or pass `--set`, filling in:

- `database.url`
- `redis.url`
- `storage.*` (endpoint, bucket, access/secret key)
- `auth.betterAuthSecret` / `auth.gitTokenEncryptionKey` — each `openssl rand -base64 32`
- `env.baseUrl` — public URL the app will be served at

Or set `existingSecret` to the name of a Secret you manage yourself with keys:
`DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET`, `OVR_GIT_TOKEN_ENCRYPTION_KEY`,
`STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`.

## 2. Install

```sh
helm install ovr ./charts/ovr -f my-values.yaml
```

Install fails with a message naming the missing value if any required one is
unset, rather than deploying pods that crash at startup. Values are also
checked against `values.schema.json` first, so a misspelled or wrongly typed
key is an error rather than a setting that is silently ignored.

Once it is up, `helm test <release>` runs a pod that checks the web readiness
endpoint through its Service.

A migration Job runs automatically before the app starts (pre-install/pre-upgrade hook).

## 3. Expose it

Set `web.ingress.enabled: true` and `web.ingress.host` (add `web.ingress.className`
and `web.ingress.annotations` for cert-manager/TLS as needed), or use
`kubectl port-forward` for a quick check — see `helm install` output.

Once `web.ingress.tls` is set, `web.ingress.redirectHttps` (default `true`)
redirects plain HTTP to HTTPS. It is implemented for `className: traefik` and
`className: nginx`; on any other controller it does nothing, and you should
configure the redirect yourself.

## Images

Published at `ghcr.io/open-visual-regression/{web,worker}`.

`image.tag` is empty by default, which resolves to the chart's `appVersion` —
stamped at publish time with the app version the chart was released for. A
released chart therefore installs a specific, immutable version, and
`helm upgrade --version X.Y.Z` is what moves it.

Set `image.tag` to pin something else: a `sha-<short-sha>` build, or a moving
branch tag like `main` (which needs `pullPolicy: Always` to ever repull, since
`IfNotPresent` will sit on a cached copy forever).

`image.tag`/`image.digest` apply to both images. To pin them separately — they
are different images and will not share a digest — use `web.image.*` and
`worker.image.*`, each supporting `tag`, `digest`, and `override` (a complete
image reference, highest precedence).

## Running as non-root

`podSecurityContext` defaults to UID/GID 1001, matching the images. The images
declare their user by name, which the kubelet cannot verify against
`runAsNonRoot`, so a numeric UID has to be supplied here. Override it if you
build the images with different `UID`/`GID` build args.

`containerSecurityContext` drops all capabilities, disables privilege
escalation and sets a `RuntimeDefault` seccomp profile — enough for Pod
Security Admission `restricted`. `readOnlyRootFilesystem` stays `false`:
Next.js writes its cache and Chromium writes scratch files at runtime.

The **worker overrides this and omits `seccompProfile`**. The app launches
Chromium with its sandbox enabled, so the browser needs unprivileged user
namespaces, and `RuntimeDefault` restricts the clone flags that sandbox
depends on — the classic "Chromium won't start in Docker" failure. So the
worker is not admissible to a `restricted` namespace as shipped. Running it
in one means setting `worker.containerSecurityContext.seccompProfile` **and**
launching Chromium with `--no-sandbox`, which trades the browser's sandbox
for the kernel's. Set `web.containerSecurityContext` to override the web pod
independently.

## Object storage credentials

`storage.accessKey`/`storage.secretKey` put static credentials in a Secret.
Prefer binding a cloud IAM role to the chart's ServiceAccount instead:

```yaml
serviceAccount:
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::111122223333:role/ovr
storage:
  accessKey: ""
  secretKey: ""
```

Leaving both empty omits them from the Secret entirely, so the app falls
through to the provider's default credential chain and picks up the role.
Works the same for GKE Workload Identity, or anything else that binds an
identity to a ServiceAccount.

The migration Job deliberately does **not** use this ServiceAccount. It runs
as a `pre-install` hook, before the ServiceAccount exists, and it only ever
needs `DATABASE_URL` — never object storage — so it runs on the namespace's
`default` account with no API token mounted.

## Resource naming

Objects are named after the release alone — release `ovr-app` gives
`ovr-app-web`, `ovr-app-worker` — rather than the more usual
`<release>-<chart>`. `fullnameOverride` changes the prefix and `nameOverride`
changes the `app.kubernetes.io/name` label.

Both feed selectors, which Kubernetes will not let you change after an object
is created. Set them at install time; changing either on an existing release
means uninstalling and reinstalling.

## Scaling

Everything here is off by default and changes nothing until you enable it.

**Web** scales on CPU. `web.autoscaling.enabled` creates an `autoscaling/v2`
HPA, and the Deployment stops rendering `replicas` so a GitOps sync can't
fight the autoscaler back down. Utilization targets are a percentage of the
container's *request*, so `web.resources.requests` must be set or the HPA
never scales.

**Worker** should scale on queue depth, not CPU. A pod holding an idle browser
between snapshots looks unloaded while it's very much busy, so an HPA reading
CPU will scale it away mid-capture. `worker.keda.enabled` creates a KEDA
`ScaledObject` instead — KEDA has to be installed separately; the chart does
not install it. Capture work lands on the BullMQ `snapshot-capture` queue,
whose waiting list is `bull:snapshot-capture:wait`:

```yaml
worker:
  keda:
    enabled: true
    maxReplicaCount: 8
    cooldownPeriod: 600
    triggers:
      - type: redis
        metadata:
          address: valkey:6379
          listName: bull:snapshot-capture:wait
          listLength: "4"
```

`triggers` has no default because the address format and authentication
depend on your Redis. Two settings need care together: `cooldownPeriod` must
outlast the longest capture group (`worker.groupSize` snapshots at up to two
minutes each), and `worker.terminationGracePeriodSeconds` must cover the
in-flight snapshot on top of that — otherwise a scale-down kills a pod
holding a browser. `worker.autoscaling` and `worker.keda` are mutually
exclusive and the templates fail if both are on, since KEDA creates and owns
its own HPA.

**Disruption budgets** (`podDisruptionBudget.enabled`) take exactly one of
`minAvailable` or `maxUnavailable`; setting both, or neither, fails the
render. Neither is defaulted — Helm coalesces maps, so a default would merge
with whichever one you set and trip the both-set check. `maxUnavailable: 1` is
usually the one you want: `minAvailable: 1` against a single replica blocks
node drains outright.

**Spreading** is `topologySpreadConstraints`, passed through verbatim — the
chart does not inject a `labelSelector`, so include one matching the
component. `priorityClassName` is available on both components.

## Network policies

`networkPolicy.enabled` writes a policy per component. The worker gets
deny-all ingress, which is simply true of it: it serves nothing and nothing
addresses it. The web pod admits traffic on its port, from anywhere in the
cluster unless you narrow `networkPolicy.web.from` to your ingress
controller.

Egress always permits DNS. Beyond that it is unrestricted by default, because
Postgres, Redis and object storage usually live outside the cluster and differ
per install. Setting `networkPolicy.egress` replaces that default entirely, so
it has to list everything the pods reach.
