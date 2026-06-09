# 51 · Build retention

Gate: unit tests cover `purgeExpiredBuilds` (deletes expired builds, skips builds referenced by a baseline); a `build:purge` repeatable job is scheduled on worker startup.

Depends on: `c25-project-settings` (`retentionDays`), `c27-build-schema`, `c28-storage-package`, `c29-queue-package`, `c35-worker`

Each project has a configurable `retentionDays` (`c25-project-settings`). A nightly job deletes builds older than that window, along with their storage objects, except builds that hold a project's current baseline for any story/variant.

- [ ] 1.1 `packages/db/src/repositories/builds.ts` — add:
  - `findExpired(projectId, cutoff: Date)` → builds where `projectId` matches and `createdAt < cutoff`
  - `delete(buildId)` → deletes the build row; cascading FKs (`c27-build-schema`) remove its snapshots, diffs, and snapshot logs

- [ ] 1.2 `packages/db/src/repositories/baselines.ts` — add:
  - `existsForBuild(buildId)` → boolean — true if any `baseline.snapshotId` references a snapshot belonging to `buildId`

- [ ] 1.3 `packages/queue/src/index.ts` — add:
  - `QueueName.BUILD_PURGE = "build:purge"`
  - `PurgeJobPayload {}` (empty — handler sweeps all projects)
  - `schedulePurge(redis)`: adds a repeatable job with a fixed `jobId` (e.g. `"build-purge-daily"`) and `repeat: { pattern: "0 3 * * *" }` (daily at 03:00 UTC); BullMQ dedupes repeatable jobs by `jobId`, so this is safe to call on every worker startup

- [ ] 1.4 `packages/services/src/retention.ts`:

  `purgeExpiredBuilds()`:
  - For each project (`projectsRepo.findAll()`): compute `cutoff = now - project.retentionDays days`
  - `buildsRepo.findExpired(project.id, cutoff)` → for each build:
    - If `baselinesRepo.existsForBuild(build.id)` → skip (build holds a current baseline)
    - `storage.deletePrefix(\`builds/${build.id}/\`)`
    - `buildsRepo.delete(build.id)`

  Unit tests (mocked repos + storage):
  - Expired build with no baseline → storage prefix deleted, build row deleted
  - Expired build referenced by a baseline → skipped entirely, no storage or DB calls
  - Build newer than `retentionDays` → not returned by `findExpired`, untouched

- [ ] 1.5 `apps/worker/src/index.ts`: call `schedulePurge(redis)` on startup, alongside the existing `Worker` instances

- [ ] 1.6 `apps/worker/src/handlers/purge.ts`:
  - Receives `PurgeJobPayload`; calls `purgeExpiredBuilds()`
  - Retry config: `{ attempts: 1 }` — a failed sweep is retried on the next scheduled run rather than immediately

- [ ] 1.7 Unit tests for the purge handler (mock `purgeExpiredBuilds`): handler invokes the service function
