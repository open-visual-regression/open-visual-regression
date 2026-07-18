# 58 · Build reaper (no-strand guarantee)

> Status: DONE (implemented outside OpenSpec). `updatedAt` added to `builds`/`snapshots`/`diffs`;
> `findStale` on the builds repository; business logic in `packages/builds/src/reaper.ts`
> (`resolveStaleBuilds`); the stuck-row updates ship as `snapshots.markUnfinishedAs` /
> `diffs.markPendingAs` (not `markStuckAsError*`) — same effect. `BUILD_REAPER` queue +
> `scheduleReaper` on worker startup; handler at `apps/worker/src/handlers/reaper.ts`; covered by
> `builds.integration.test.ts` and `reaper.integration.test.ts`.

Gate: `findStale` returns exactly the builds that are genuinely stuck (stale
age + no child-row activity), and excludes both fresh builds and
builds that are large-but-actively-progressing; a `build-reaper` repeatable
job is scheduled on worker startup and force-resolves stale builds to
`error`, marking their unfinished snapshots/diffs `error` too.

## Context — why this exists

This is part of a larger capture-pipeline scalability rework (six slices,
of which 1–3 are already merged/in-review as PRs #134, #135, #136 on
branches `claude/fix-build-upload-race`, `claude/capture-local-bundle-cache`,
`claude/capture-warm-browser-pool`). Slices 1–3 fixed the load/throughput
side (an upload/extract race producing `NoSuchKey`, and a per-snapshot
browser-relaunch storm that melted the machine under concurrent CLI runs).
**This slice (4) is independent of that work** — it fixes a *different*,
still-open defect: builds can get permanently stuck in `queued` or
`processing` with no way out.

### The defect

`checkAllDoneAndFinalize` (`packages/capture/src/snapshots.ts`) only enqueues
`BUILD_FINALIZE` once `dbClient.diffs.hasAllDoneForBuild(buildId)` is true —
i.e. every snapshot in the build has a diff row in a terminal
(`success`/`error`) state. If any single snapshot never gets there — a
dropped BullMQ job, a lost enqueue, a handler that throws before writing its
terminal state — the build sits in `queued`/`processing` **forever**. There
is currently no code anywhere that force-resolves a build after a timeout.
This is the direct fix for "builds getting stuck" reported against the
pipeline.

### Why a naive `createdAt` timeout is wrong

The DB schema currently has **no `updatedAt` column anywhere** except
`auth.ts` (confirmed by reading every table in
`packages/db/src/schemas/builds.ts`): `builds` has `createdAt` only;
`snapshots` and `diffs` have no timestamps at all. A staleness check based
purely on `builds.createdAt` age would false-positive on a build that is
large (many snapshots) but genuinely still progressing — it would get
reaped mid-flight. The fix must distinguish "old and dead" from "old and
still working."

## Design

1. Add `updatedAt` to `builds`, `snapshots`, and `diffs` via Drizzle's
   `$onUpdate(() => new Date())` (default `now()`). This is automatic —
   every existing repository call that already does an `UPDATE` on these
   tables (`updateStatus`, `updateCaptureResult`, `updateProcessingStatus`,
   `updateResult`, etc.) will stamp `updatedAt` with zero handler changes.
2. A build is stale when: `processingStatus IN ('queued','processing')` AND
   `createdAt` is older than the stale window (age floor — don't reap fresh
   builds) AND **no** snapshot or diff belonging to it has `updatedAt`
   within the stale window (i.e. genuinely no recent progress anywhere in
   the build's tree, not just "this build is old").
3. Mirror the existing periodic-job pattern **exactly** —
   `packages/queue/src/index.ts`'s `schedulePurge` is the precedent to copy:
   uses BullMQ's `Queue.upsertJobScheduler` with a cron pattern, called once
   at worker boot in `apps/worker/src/index.ts` alongside the existing
   `schedulePurge` call. Read `schedulePurge` and
   `apps/worker/src/handlers/purgeDispatch.ts` /
   `apps/worker/src/handlers/purge.ts` before writing this — the reaper's
   dispatch/schedule shape should look like `schedulePurge`, and the reaper
   handler itself should look like `purge.ts` (thin handler → business logic
   in `packages/builds/src/retention.ts`-equivalent).

### `findStale` query shape

```sql
SELECT b.id FROM builds b
WHERE b.processing_status IN ('queued', 'processing')
  AND b.created_at < now() - interval '{staleMinutes} minutes'
  AND NOT EXISTS (
    SELECT 1 FROM snapshots s
    WHERE s.build_id = b.id AND s.updated_at > now() - interval '{staleMinutes} minutes'
  )
  AND NOT EXISTS (
    SELECT 1 FROM diffs d
    JOIN snapshots s2 ON d.snapshot_id = s2.id
    WHERE s2.build_id = b.id AND d.updated_at > now() - interval '{staleMinutes} minutes'
  )
ORDER BY b.created_at ASC
LIMIT {limit}
```

Translate to Drizzle in `packages/db/src/repository/builds.ts`, following
the query style already used by `findExpiredPage` in that same file (a
`NOT EXISTS` join precedent already exists there for build retention — read
it first).

## Tasks

- [x] 1.1 `packages/db/src/schemas/builds.ts` — add `updatedAt` (Drizzle
  `$onUpdate(() => new Date())`, default `sql\`now()\``, matching the
  existing `createdAt` column's style in this file) to the `builds`,
  `snapshots`, and `diffs` table definitions.

- [x] 1.2 Generate the migration: run the repo's Drizzle migration
  generation command (see `package.json` `db:generate` script) — do **not**
  hand-write the SQL file. Confirm the generated migration only adds three
  nullable-then-defaulted `updated_at` columns and doesn't touch anything
  else. Run it against a local/test DB to confirm it applies cleanly.

- [x] 1.3 `packages/db/src/repository/builds.ts` — add
  `findStale(staleMinutes: number, limit: number): Promise<string[]>`
  implementing the query above. Follow the existing style of
  `findExpiredPage` in this file for the `NOT EXISTS` join pattern.

- [x] 1.4 `packages/db/src/repository/snapshots.ts` — add
  `markStuckAsError(buildId: string): Promise<void>` — bulk
  `UPDATE snapshots SET status = 'error' WHERE build_id = $1 AND status NOT IN ('success', 'error')`.

- [x] 1.5 `packages/db/src/repository/diffs.ts` — add
  `markStuckAsErrorForBuild(buildId: string): Promise<void>` — same shape,
  joined through `snapshots` to filter by `buildId` (diffs don't have a
  direct `buildId` column — check `diffs.snapshotId → snapshots.buildId`).

- [x] 1.6 `packages/queue/src/index.ts` — add:
  - `QueueName.BUILD_REAPER = "build-reaper"` (string value convention:
    match the kebab-case style already used for the other queue names in
    this enum, e.g. `"build-purge-dispatch"`)
  - `ReaperJobPayload = Record<string, never>` (empty payload — handler
    sweeps globally, same shape as `PurgeDispatchJobPayload`)
  - `scheduleReaper(connection: IORedis): Promise<void>` — copy
    `schedulePurge`'s implementation shape exactly (`Queue.upsertJobScheduler`
    with a fixed job id, e.g. `"build-reaper"`, and a cron pattern — suggest
    `*/5 * * * *`, every 5 minutes; `schedulePurge` runs daily at `0 3 * * *`,
    the reaper needs to run far more often since it's the stuck-build safety
    net, not a cleanup sweep)
  - a `JOB_OPTIONS[QueueName.BUILD_REAPER]` entry (`attempts: 3`,
    exponential backoff, matching the other entries in that map)

- [x] 1.7 `apps/worker/src/handlers/reaper.ts` (new file) — `run(job)`:
  - `const staleMinutes = Number(process.env.REAPER_STALE_MINUTES ?? 30)`
  - `const staleBuildIds = await dbClient.builds.findStale(staleMinutes, BATCH_LIMIT)`
    (pick a sane `BATCH_LIMIT` constant, e.g. 100, so one reaper tick can't
    try to resolve an unbounded number of builds)
  - for each stale build id: `dbClient.snapshots.markStuckAsError(id)`,
    `dbClient.diffs.markStuckAsErrorForBuild(id)`, then
    `dbClient.builds.updateProcessingStatus(id, "error", \`Build timed out: no processing activity for ${staleMinutes} minutes\`)`
  - Also add a `failed` export (even a minimal one that just logs) matching
    the convention every other handler in `apps/worker/src/handlers/`
    follows (see `purge.ts`, `purgeDispatch.ts`) — the worker's `guard`
    wrapper in `apps/worker/src/index.ts` expects every handler module to
    export both `run` and `failed`.

- [x] 1.8 `apps/worker/src/index.ts` — register a `reaperWorker = new Worker(QueueName.BUILD_REAPER, reaper.run, { connection })`
  alongside the other `Worker` instances, wire its `"failed"` event through
  the existing `guard(reaper.failed)` pattern, add it to the `workers` array
  used for graceful shutdown, and call `await scheduleReaper(connection)`
  alongside the existing `schedulePurge(connection)` call (same try/catch
  wrapping style already used there).

- [x] 1.9 Tests — `packages/db/src/__tests__/builds.integration.test.ts`
  (existing file, extend it): cover `findStale` with builds at varying
  ages/statuses/child-row-activity combinations. Must include an explicit
  negative case named something like
  `should not return a build whose snapshots updated recently even if the build itself is old`
  — this is the key case that distinguishes "stuck" from "large and slow."
  Also cover: a `success`/`error` build (not `queued`/`processing`) is never
  returned regardless of age; a build younger than the stale window is never
  returned regardless of activity.

- [x] 1.10 Tests —
  `apps/worker/src/handlers/__tests__/reaper.integration.test.ts` (new,
  match the existing pattern used by sibling files in that directory, e.g.
  `capture.integration.test.ts`, `diff.integration.test.ts` — real DB via
  Testcontainers, no mocks): a build stuck in `processing` with snapshots
  stuck in `queued`/`processing` and no recent activity → after calling the
  reaper's business logic directly (not necessarily through the BullMQ job
  wrapper), assert `build.processingStatus === "error"`, all its snapshots
  and diffs are `error`. A second test: a build with a snapshot whose
  `updatedAt` is recent → untouched after the same call.

## Verification

- `pnpm check-types && pnpm lint:ci && pnpm format -- --check` clean.
- New + existing tests in `packages/db` and `apps/worker` pass (`pnpm --filter @ovr/db test`, `pnpm --filter @ovr/worker test` — both need Docker for Testcontainers).
- Manual: start the worker, create a build via the CLI, kill the worker mid-`processing` (or otherwise strand it — e.g. delete a snapshot's capture job from the queue by hand), wait past `REAPER_STALE_MINUTES`, confirm the build transitions to `error` on its own without manual intervention.
