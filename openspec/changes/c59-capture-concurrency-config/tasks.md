# 59 · Capture concurrency env config for horizontal scaling

Gate: `CAPTURE_GROUP_CONCURRENCY` and `CAPTURE_GROUP_SIZE` are read from
`process.env` with sane defaults matching today's hardcoded values; invalid
or unset env values fall back cleanly (no crash, no `NaN` concurrency).

## Context — why this exists, and a hard prerequisite

This is slice 5 of a six-slice capture-pipeline scalability rework. Slices
1–3 are merged/in-review as PRs #134 (`claude/fix-build-upload-race`), #135
(`claude/capture-local-bundle-cache`), and #136
(`claude/capture-warm-browser-pool`). **This change has a hard dependency
on PR #136 (slice 3) — branch off `claude/capture-warm-browser-pool`, or
off `main` once that PR has merged. Do not start this before slice 3 lands**;
the code this task touches (`CAPTURE_GROUP_SIZE`, the capture-group job
model) doesn't exist before it.

### What slice 3 changed (read this before touching anything)

Capture used to be one BullMQ job per snapshot, each launching a fresh
Playwright browser and re-downloading the whole Storybook bundle. Slice 3
re-cut it to one job per `(build, browser engine)`, chunked into
`CAPTURE_GROUP_SIZE`-sized batches (`packages/capture/src/extract.ts`,
currently a hardcoded `const CAPTURE_GROUP_SIZE = 10`). Each group job boots
one browser once and reuses it across every snapshot in the group. Slice 3
also **deleted** `OVERRIDE_READ_CONCURRENCY` (an 8-wide concurrent-page fan-out
for reading story viewport overrides during extract) rather than keeping it
around as a tunable — it was the same per-snapshot-browser-launch problem
capture had, just in the extract phase, and the fix (boot once, iterate
stories via the Storybook `setCurrentStory` addons-channel event) doesn't
need a concurrency knob at all.

**Important — do not reintroduce an override-read concurrency setting.**
There is deliberately no third knob here; only the two below.

### Why this is safe now (and wasn't before)

With slices 2–3 landed, per-job cost is amortized: one tarball pull and one
browser launch per `(build, engine)` group, not per snapshot. Raising
worker concurrency used to directly multiply the number of concurrent
browser launches and S3 downloads, which is what melted the machine under
load in the first place. Now it just runs more (cheap) group jobs in
parallel. That's the whole reason this config change was deferred to *after*
slices 2–3 rather than being a naive "just bump concurrency" fix — see the
project's incident writeup if you want the full history (the pipeline used
to reach load average 27 processing a single 45-snapshot build).

## Tasks

- [ ] 1.1 `apps/worker/src/index.ts` — `captureWorker`'s `concurrency`
  option should read from `Number(process.env.CAPTURE_GROUP_CONCURRENCY ?? 2)`.
  Guard against `NaN` (e.g. a malformed env value) by falling back to the
  default `2` in that case too — don't let `Number("garbage")` silently
  become `NaN` and get passed to BullMQ's `Worker` constructor. Check
  `apps/worker/src/env.ts` for whatever env-parsing convention already
  exists in this app before writing a new one from scratch.

- [ ] 1.2 `packages/capture/src/extract.ts` — replace the hardcoded
  `const CAPTURE_GROUP_SIZE = 10;` with an env-driven read, same
  `NaN`-guarded pattern as above, default `10` (the current hardcoded
  value — don't change the default's magnitude, only make it configurable).

- [ ] 1.3 Document both env vars. Check whether this repo has a `.env.example`
  or a README table listing worker env vars (search for where
  `VALKEY_URL`/`DATABASE_URL`/`STORAGE_ENDPOINT` etc. are documented) and
  add `CAPTURE_GROUP_CONCURRENCY` and `CAPTURE_GROUP_SIZE` there in the same
  style, with a one-line note on what each controls and that horizontal
  scaling means running multiple `apps/worker` instances against the same
  Valkey/Postgres/storage backends (each instance is a stateless BullMQ
  consumer; each extracts Storybook bundles to its own local disk — see
  `packages/capture/src/lib/artifact.ts`'s `withExtractedBundle`, which is
  self-cleaning per job, so there's no shared-state or cache-coherency
  concern across instances).

- [ ] 1.4 Unit test for the env-parsing fallback behavior (wherever the
  parsing helper ends up living — if it's a small shared function, test it
  directly; if it's inlined at each call site, test through the smallest
  reasonable seam). Cover: unset env var → default; non-numeric env value
  → default (not `NaN`); a valid override → that value is used.

## Verification

- `pnpm check-types && pnpm lint:ci && pnpm format -- --check` clean.
- New unit test passes.
- This slice is primarily operational — the real verification is running
  it, not just testing it. Start two `apps/worker` processes pointed at the
  same Valkey/Postgres/storage with `CAPTURE_GROUP_CONCURRENCY` set to
  something above 1 on at least one of them, queue a build with enough
  snapshots to produce multiple capture-group jobs across two browser
  engines, and confirm: both worker processes pick up jobs, snapshots
  complete successfully, and no S3/storage connection-timeout errors or
  stranded builds occur under the load. Note in the PR description that
  this was verified operationally, not just via the unit test.
