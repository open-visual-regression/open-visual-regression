# 35 · BullMQ worker

Gate: worker starts; enqueue a capture job → it runs and transitions snapshot to "captured"; retry policy verified in unit tests.

- [x] 1.1 Install `bullmq`, `ioredis` in `apps/worker`; install `playwright` (Chromium) — worker image will have browser binaries
- [x] 1.2 Create `apps/worker/src/index.ts`:
  - Connect to Valkey via `VALKEY_URL` env (default `redis://localhost:6379`)
  - Create `Worker` instances for each queue name (from `@ovr/queue`)
  - SIGTERM handler: `await Promise.all(workers.map(w => w.close()))` → `process.exit(0)`

- [x] 1.3 Implement capture worker (`apps/worker/src/handlers/capture.ts`):
  - Receives `CaptureJobPayload`; calls `captureSnapshot(snapshotId)`
  - Retry config: `{ attempts: 5, backoff: { type: "exponential", delay: 2000 } }`

- [x] 1.4 Implement diff worker (`apps/worker/src/handlers/diff.ts`):
  - Receives `DiffJobPayload`; calls `diffSnapshot(snapshotId, diffId)`
  - Retry config: `{ attempts: 3, backoff: { type: "exponential", delay: 2000 } }`

- [x] 1.5 Implement finalize worker (`apps/worker/src/handlers/finalize.ts`):
  - Receives `FinalizeJobPayload`; calls `finalizeBuild(buildId)`
  - Retry config: `{ attempts: 3, backoff: { type: "fixed", delay: 1000 } }`

- [x] 1.6 Handle BullMQ `failed` event (all retries exhausted) in `apps/worker/src/index.ts`:
  - Queue `snapshot:capture` failed: `snapshotsRepo.updateStatus(snapshotId, "error")` → check `hasAllDoneForBuild` → if true enqueue finalize
  - Queue `snapshot:diff` failed: `diffsRepo.updateStatus(diffId, "error")` → same check

  Retry job options live in `@ovr/queue`'s `enqueue*` functions (set at job-creation/producer time, per BullMQ semantics), not in the worker's handler files — handler files only contain the per-job logic + failure-recovery logic. A new `build-extract` queue/handler/retry-config was also added ahead of capture (see [[c32-capture-service]]) — its `failed` handler marks the build as `error`. Failure handlers are wrapped in a try/catch guard in `index.ts` so an error inside a failure handler can't crash the whole worker process (a stale non-UUID test job in dev Redis crashed the worker before this was added — caught during e2e verification).

- [x] 1.7 Remove `passWithNoTests: true` from `apps/worker/vitest.config.ts`; unit tests for handlers (mock service functions):
  - Capture handler: calls `captureSnapshot`; retry config correct
  - Diff handler: calls `diffSnapshot`; retry config correct
  - Finalize handler: calls `finalizeBuild`
  - `failed` event: snapshot error → status updated → finalize enqueued if last

  Additionally: `apps/worker` had no working runtime entrypoint (workspace packages resolve to raw `.ts` via `exports` maps, and BullMQ's `enum QueueName` isn't supported by Node's native TS-stripping). Added `tsup` bundling (`noExternal` for `@ovr/*`, `external` for native/runtime-dependent deps like `playwright`/`pg`) matching `apps/cli`'s existing convention, plus `dev`/`start` scripts.
