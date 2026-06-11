# 27 · Build/diff schema + repositories

Gate: migration applies cleanly; integration tests cover all repository functions against real Postgres.

- [x] 1.1 Create `packages/db/src/schema/builds.ts`:
  ```ts
  buildStatus enum: "pending" | "needs_review" | "passed" | "error"
  snapshotStatus enum: "pending" | "captured" | "error"
  diffStatus enum: "pending" | "auto_approved" | "needs_review" | "approved" | "rejected" | "error"
  captureMode enum: "worker" | "pre_captured"

  build:       id, projectId (FK→project cascade), branch, commitSha, status (buildStatus default pending),
               captureMode (captureMode default "worker"), storybookPath, createdAt (defaultNow), createdBy (FK→user)

  snapshot:    id, buildId (FK→build cascade), captureConfigurationId (FK→captureConfiguration), storyId,
               status (snapshotStatus default pending), imagePath (nullable), hasRenderError (bool default false)

  snapshotLog: id, snapshotId (FK→snapshot cascade), level, message, timestamp (defaultNow)

  diff:        id, snapshotId (FK→snapshot cascade), baselineSnapshotId (nullable FK→snapshot),
               status (diffStatus default pending), diffImagePath (nullable),
               pixelDiffCount (int nullable), diffPercent (real nullable),
               reviewerId (nullable FK→user), reviewedAt (timestamp nullable)

  baseline:    id, projectId (FK→project cascade), captureConfigurationId (FK→captureConfiguration), storyId,
               snapshotId (FK→snapshot), approvedAt (defaultNow), approvedBy (FK→user)
               UNIQUE(projectId, captureConfigurationId, storyId)
  ```
- [x] 1.2 Run `drizzle-kit generate`; commit migration

`captureMode` distinguishes how a build's snapshots are produced: `"worker"` means the worker renders each story with Playwright (the only mode used today, by `ovr snapshot storybook`); `"pre_captured"` means snapshots were captured by the source itself and uploaded directly, skipping the capture step entirely. This field exists so future snapshot sources (e.g. browser-mode test runners) can plug into the same build/diff pipeline without a schema change.
- [x] 1.3 Create repositories in `packages/db/src/repositories/`:

  `builds.ts`: `create`, `findById`, `updateStatus(id, status)`, `findByProject(projectId, opts?: { branch?, status? })`

  `snapshots.ts`: `createMany(snapshots[])`, `findByBuild(buildId)`, `updateStatus(id, status)`,
  `hasAllCapturedForBuild(buildId)` → boolean, `countByBuild(buildId)`

  `diffs.ts`: `create`, `findById`, `findByBuild(buildId)`, `updateStatus(id, status)`,
  `updateReview(id, { reviewerId, reviewedAt, status })`, `hasAllDoneForBuild(buildId)` → boolean

  `baselines.ts`: `find(projectId, captureConfigurationId, storyId)` → baseline | undefined,
  `upsert(data)` → baseline, `findByProject(projectId)` → baseline[]

- [x] 1.4 Export all from `packages/db/src/index.ts`
- [x] 1.5 Integration tests: create build → create snapshots → update statuses → find; upsert baseline replaces existing
