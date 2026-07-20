---
name: pulling-images
description: How to get Docker working — for docker compose, ad-hoc docker pull, and testcontainers-based integration tests — in a sandboxed environment where the daemon is not started or the network blocks part of the registry path. Apply whenever a `docker` command fails to connect to the daemon, or an image pull fails, hangs, or times out while setting up the app or running integration tests.
license: MIT
metadata:
  author: claude
  version: "1.1.0"
---

# Running Docker in a Restricted Sandbox

## Rules

### `start-the-daemon-before-concluding-its-unavailable` — CRITICAL

A `docker` command that fails with `Cannot connect to the Docker daemon at
unix:///var/run/docker.sock. Is the docker daemon running?` means the daemon
is **not started** — not that Docker is unavailable. These sandboxes ship the
Docker binaries but do not auto-start the daemon. Never report Docker,
`docker compose`, or testcontainers as unavailable based on one failed
command; confirm the binaries first, then start the daemon yourself.

Confirm Docker is actually installed before deciding it is missing:

```bash
which dockerd docker   # if dockerd is on PATH, Docker is available — just not running
```

Start the daemon. With systemd, `systemctl start docker`. In minimal
sandboxes without systemd, launch `dockerd` directly in the background and
wait for the socket to come up:

```bash
nohup dockerd >/var/log/dockerd.log 2>&1 &
until docker info >/dev/null 2>&1; do sleep 1; done
```

Running as root is normal here; the daemon needs it. Once `docker info`
succeeds the daemon is ready — apply the registry-mirror rules below so the
first pull does not fail. Configure the mirror in `/etc/docker/daemon.json`
**before** starting the daemon (or restart it after) so the mirror is in
effect for the very first pull.

### `recognize-the-symptom` — HIGH

Sandboxed or CI environments often allow talking to a registry's API (auth,
manifest) but block the actual blob/layer download host, since Docker Hub
serves layers from a separate CDN host than its API. The telltale sign:
`docker pull` prints `Pulling from ...`, resolves the manifest, then fails on
the *first layer* with a timeout or a blocked-connection error — never on
auth. `docker compose up` and testcontainers show the same symptom on
whichever image they try to pull next.

### `configure-a-registry-mirror` — CRITICAL

Point the Docker daemon at an allowed pull-through mirror instead of Docker
Hub directly. This fixes `docker pull`, `docker compose up`, and every
Dockerfile `FROM` line in one place, since they all go through the same
daemon.

`/etc/docker/daemon.json`:

```json
{
  "registry-mirrors": ["https://mirror.gcr.io"]
}
```

Restart the daemon for it to take effect (`systemctl restart docker`, or
restart the `dockerd` process directly in minimal sandboxes without
systemd), then confirm:

```bash
docker info | grep -A2 "Registry Mirrors"
```

`mirror.gcr.io` (Google's public pull-through cache for Docker Hub) is a
reasonable default to try; use whatever mirror your environment's network
policy actually allows — check for one before assuming none exists.

### `testcontainers-uses-the-same-mirror` — HIGH

This repo's integration tests (`packages/testing/src/containers.ts`, and the
various `vitest.integration.globalSetup.ts` files) pull `postgres`,
`rustfs/rustfs`, and `valkey/valkey` via `testcontainers`. Since
Testcontainers talks to the same Docker daemon, a daemon-level registry
mirror fixes these pulls too — no test code changes needed.

If you need to rewrite image names explicitly (the daemon-level mirror isn't
an option, or you want it scoped to just one run), Testcontainers reads
`TESTCONTAINERS_HUB_IMAGE_NAME_PREFIX` and prepends it as the registry for
any unqualified image name, including its own internal helper container:

```bash
TESTCONTAINERS_HUB_IMAGE_NAME_PREFIX=mirror.gcr.io pnpm --filter @ovr/db test:integration
```

### `dont-route-around-explicit-denials` — MEDIUM

An outright 403 or connection-refused on a *specific* host is often a
deliberate network policy boundary, not a bug — don't try to tunnel around
it. Look for an already-permitted alternative path (a mirror, a different
registry) instead of disabling verification or forcing the connection.

## Quick Reference

| Task | Command |
|------|---------|
| Check the daemon is running | `docker info` (connection error = not started, not unavailable) |
| Confirm Docker is installed at all | `which dockerd docker` |
| Start the daemon without systemd | `nohup dockerd >/var/log/dockerd.log 2>&1 &` then `until docker info >/dev/null 2>&1; do sleep 1; done` |
| Check configured mirrors | `docker info \| grep -A2 "Registry Mirrors"` |
| Add a mirror | edit `/etc/docker/daemon.json` → `"registry-mirrors": [...]`, restart the daemon |
| Force Testcontainers through a mirror | `TESTCONTAINERS_HUB_IMAGE_NAME_PREFIX=<mirror-host>` |
| Confirm the fix worked | retry the previously-failing `docker pull <image>` |
