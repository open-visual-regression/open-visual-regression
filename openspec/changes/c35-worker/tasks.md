# 35 · BullMQ worker

Gate: worker starts; enqueue a capture job → it runs and transitions snapshot to "captured"; retry policy verified in unit tests.

- [ ] 1.1 Install `bullmq`, `ioredis` in `apps/worker`; install `playwright` (Chromium) — worker image will have browser binaries
- [ ] 1.2 Create `apps/worker/src/index.ts`:
  - Connect to Valkey via `VALKEY_URL` env (default `redis://localhost:6379`)
  - Create `Worker` instances for each queue name (from `@ovr/queue`)
  - SIGTERM handler: `await Promise.all(workers.map(w => w.close()))` → `process.exit(0)`

- [ ] 1.3 Implement capture worker (`apps/worker/src/handlers/capture.ts`):
  - Receives `CaptureJobPayload`; calls `captureSnapshot(snapshotId)`
  - Retry config: `{ attempts: 5, backoff: { type: "exponential", delay: 2000 } }`

- [ ] 1.4 Implement diff worker (`apps/worker/src/handlers/diff.ts`):
  - Receives `DiffJobPayload`; calls `diffSnapshot(snapshotId, diffId)`
  - Retry config: `{ attempts: 3, backoff: { type: "exponential", delay: 2000 } }`

- [ ] 1.5 Implement finalize worker (`apps/worker/src/handlers/finalize.ts`):
  - Receives `FinalizeJobPayload`; calls `finalizeBuild(buildId)`
  - Retry config: `{ attempts: 3, backoff: { type: "fixed", delay: 1000 } }`

- [ ] 1.6 Handle BullMQ `failed` event (all retries exhausted) in `apps/worker/src/index.ts`:
  - Queue `snapshot:capture` failed: `snapshotsRepo.updateStatus(snapshotId, "error")` → check `hasAllDoneForBuild` → if true enqueue finalize
  - Queue `snapshot:diff` failed: `diffsRepo.updateStatus(diffId, "error")` → same check

- [ ] 1.7 Remove `passWithNoTests: true` from `apps/worker/vitest.config.ts`; unit tests for handlers (mock service functions):
  - Capture handler: calls `captureSnapshot`; retry config correct
  - Diff handler: calls `diffSnapshot`; retry config correct
  - Finalize handler: calls `finalizeBuild`
  - `failed` event: snapshot error → status updated → finalize enqueued if last
