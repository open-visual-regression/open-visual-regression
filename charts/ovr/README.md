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

## Resource naming

Objects are named after the release alone — release `ovr-app` gives
`ovr-app-web`, `ovr-app-worker` — rather than the more usual
`<release>-<chart>`. `fullnameOverride` changes the prefix and `nameOverride`
changes the `app.kubernetes.io/name` label.

Both feed selectors, which Kubernetes will not let you change after an object
is created. Set them at install time; changing either on an existing release
means uninstalling and reinstalling.
