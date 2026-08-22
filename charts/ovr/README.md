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
unset, rather than deploying pods that crash at startup.

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

Published at `ghcr.io/open-visual-regression/{web,worker}`. `image.tag` defaults
to `main` (the moving branch build). Pin to a specific `sha-<short-sha>` tag, or
to a `vX.Y.Z` release tag (the only tags that also get `latest`), for anything
you don't want to shift under you.

`image.tag`/`image.digest` apply to both images. To pin them separately — they
are different images and will not share a digest — use `web.image.*` and
`worker.image.*`, each supporting `tag`, `digest`, and `override` (a complete
image reference, highest precedence).

## Running as non-root

`podSecurityContext` defaults to UID/GID 1001, matching the images. The images
declare their user by name, which the kubelet cannot verify against
`runAsNonRoot`, so a numeric UID has to be supplied here. Override it if you
build the images with different `UID`/`GID` build args.
