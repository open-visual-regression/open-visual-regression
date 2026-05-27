# 29 · packages/queue

Gate: integration tests pass against real Valkey; enqueued jobs are dequeued by a test worker with correct payload types.

- [ ] 1.1 Install `testcontainers` in `packages/queue`; create `packages/queue/src/__tests__/helpers/containers.ts`:
  - `startValkey()` → starts `valkey/valkey:8-alpine`; returns `{ host: string, port: number, stop: () => Promise<void> }`
  - Remove `passWithNoTests: true` from `packages/queue/vitest.config.ts`
- [ ] 1.2 Install `bullmq`, `ioredis` in `packages/queue`
- [ ] 1.3 Implement `packages/queue/src/index.ts`:
  ```ts
  export enum QueueName {
    SNAPSHOT_CAPTURE = "snapshot:capture",
    SNAPSHOT_DIFF    = "snapshot:diff",
    BUILD_FINALIZE   = "build:finalize",
  }

  export interface CaptureJobPayload { buildId: string; snapshotId: string }
  export interface DiffJobPayload    { snapshotId: string; diffId: string }
  export interface FinalizeJobPayload { buildId: string }

  // Producer functions — each accepts payload + IORedis connection
  export async function enqueueCapture(payload: CaptureJobPayload, redis: IORedis): Promise<Job>
  export async function enqueueDiff(payload: DiffJobPayload, redis: IORedis): Promise<Job>
  export async function enqueueFinalize(payload: FinalizeJobPayload, redis: IORedis): Promise<Job>
  ```
- [ ] 1.4 Integration tests (`src/__tests__/integration/queue.test.ts`) using Testcontainers Valkey:
  - `enqueueCapture` → a test Worker on the same queue receives the job with correct payload
  - `enqueueDiff` → same pattern
  - `enqueueFinalize` → same pattern
  - All jobs complete; queue drains
