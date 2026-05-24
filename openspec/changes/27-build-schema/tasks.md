# 27 · Build/diff schema + repositories

Gate: migration applies cleanly; integration tests cover all repository functions against real Postgres.

- [ ] 1.1 Create `packages/db/src/schema/builds.ts`:
  ```ts
  buildStatus enum: "pending" | "needs_review" | "passed" | "error"
  snapshotStatus enum: "pending" | "captured" | "error"
  diffStatus enum: "pending" | "auto_approved" | "needs_review" | "approved" | "rejected" | "error"

  build:       id, projectId (FK→project cascade), branch, commitSha, status (buildStatus default pending),
               storybookPath, createdAt (defaultNow), createdBy (FK→user)

  snapshot:    id, buildId (FK→build cascade), variantId (FK→variant), storyId,
               status (snapshotStatus default pending), imagePath (nullable), hasRenderError (bool default false)

  snapshotLog: id, snapshotId (FK→snapshot cascade), level, message, timestamp (defaultNow)

  diff:        id, snapshotId (FK→snapshot cascade), baselineSnapshotId (nullable FK→snapshot),
               status (diffStatus default pending), diffImagePath (nullable),
               pixelDiffCount (int nullable), diffPercent (real nullable),
               reviewerId (nullable FK→user), reviewedAt (timestamp nullable)

  baseline:    id, projectId (FK→project cascade), variantId (FK→variant), storyId,
               snapshotId (FK→snapshot), approvedAt (defaultNow), approvedBy (FK→user)
               UNIQUE(projectId, variantId, storyId)
  ```
- [ ] 1.2 Run `drizzle-kit generate`; commit migration
- [ ] 1.3 Create repositories in `packages/db/src/repositories/`:

  `builds.ts`: `create`, `findById`, `updateStatus(id, status)`, `findByProject(projectId, opts?: { branch?, status? })`

  `snapshots.ts`: `createMany(snapshots[])`, `findByBuild(buildId)`, `updateStatus(id, status)`,
  `allCapturedForBuild(buildId)` → boolean, `countByBuild(buildId)`

  `diffs.ts`: `create`, `findById`, `findByBuild(buildId)`, `updateStatus(id, status)`,
  `updateReview(id, { reviewerId, reviewedAt, status })`, `allDoneForBuild(buildId)` → boolean

  `baselines.ts`: `find(projectId, variantId, storyId)` → baseline | undefined,
  `upsert(data)` → baseline, `findByProject(projectId)` → baseline[]

- [ ] 1.4 Export all from `packages/db/src/index.ts`
- [ ] 1.5 Integration tests: create build → create snapshots → update statuses → find; upsert baseline replaces existing
