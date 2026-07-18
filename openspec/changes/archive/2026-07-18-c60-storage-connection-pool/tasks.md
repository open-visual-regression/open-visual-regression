# 60 · Storage client keep-alive connection pool

Gate: `packages/storage/src/index.ts`'s S3 client uses a keep-alive HTTP
agent with a bounded socket pool; existing storage integration tests still
pass unmodified (this is a config-only change, not a behavior change).

## Context — why this exists, and why it's deliberately small

This is slice 6, the last of a six-slice capture-pipeline scalability
rework. Slices 1–3 are merged/in-review as PRs #134, #135, #136 (see
`claude/fix-build-upload-race`, `claude/capture-local-bundle-cache`,
`claude/capture-warm-browser-pool`). This slice has no code dependency on
the others — it only touches `packages/storage/src/index.ts` — but it's
sequenced last on purpose, for a reason worth understanding before touching
anything:

### Do not raise `connectionTimeout` — read this first

`packages/storage/src/index.ts` currently configures the AWS SDK's
`NodeHttpHandler` with `connectionTimeout: 5_000`. That value was added in
an earlier fix (commit `e9b7c6d`, "harden worker against S3 hangs and race
conditions") specifically to convert an indefinite hang into a fast failure
**under the old per-snapshot-browser-launch overload**, where dozens of
concurrent connections to a single-node storage backend (rustfs in dev)
would starve and hang.

Slices 2–3 already removed that overload (bundle is fetched once per
capture-group job instead of once per snapshot-per-asset; see PRs #135/#136
for the full story). The 5-second timeout is no longer the thing tripping
under normal load. **A previous iteration of this exact task tried to also
raise `connectionTimeout` to "give it more headroom," and that was
explicitly rejected during review** — raising a timeout that was added to
paper over a specific overload, *after removing the overload*, is tuning a
symptom that no longer fires instead of addressing anything real. Leave
`connectionTimeout` exactly as it is. The only genuinely useful change here
is connection reuse (below).

### What's actually being fixed

Without a keep-alive agent, Node's default HTTP behavior opens a new TCP
(and, for HTTPS, TLS) connection per outbound request unless an agent with
`keepAlive: true` is configured. Once slice 5 (`c59`) raises worker
concurrency, multiple capture-group jobs can issue storage requests
concurrently (tarball pulls, screenshot uploads, diff image uploads). A
bounded, reusable socket pool lets those share connections instead of
paying full connection setup cost on every request and instead of
unboundedly opening new sockets under concurrent load.

## Tasks

- [x] 1.1 Read `packages/storage/src/index.ts` in full first — it's a small
  file. Find the existing `NodeHttpHandler` construction (imported from
  `@smithy/node-http-handler`) that already sets `connectionTimeout`.

- [x] 1.2 Add a Node `http.Agent`/`https.Agent` (pick based on whatever
  `STORAGE_ENDPOINT` scheme is actually used in this deployment — check
  `.env.example` or how `STORAGE_ENDPOINT` is documented; rustfs in dev
  typically runs over plain HTTP) with `keepAlive: true` and a bounded
  `maxSockets` (pick a reasonable default, e.g. 50 — err toward a value that
  comfortably covers `CAPTURE_GROUP_CONCURRENCY` from `c59` × a small
  per-job fan-out margin, not an arbitrary large number). Pass it to the
  `NodeHttpHandler` config (check `@smithy/node-http-handler`'s accepted
  options — it takes an `httpAgent`/`httpsAgent` option, or a plain
  `Agent` depending on the SDK version pinned in this repo's
  `package.json`; confirm the exact option name against the installed
  version rather than assuming).

- [x] 1.3 Do **not** change `connectionTimeout`. Do not add a
  `socketTimeout` change either unless you find concrete evidence (not
  present as of this writing) that it's currently causing failures — this
  slice is scoped to connection reuse only.

## Verification

- `pnpm check-types && pnpm lint:ci && pnpm format -- --check` clean.
- `pnpm --filter @ovr/storage test` (Testcontainers/Docker required) — all
  existing tests pass unmodified; this change should not alter any
  observable storage behavior, only connection-level plumbing.
- Manual: rerun the original burst scenario this whole rework exists to
  fix — start the worker fresh, queue several concurrent CLI runs of the
  same build — and confirm no `@smithy/node-http-handler ... did not
  establish a connection within the configured timeout` errors appear in
  the worker logs.
