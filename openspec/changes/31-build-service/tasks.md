# 31 · Build service

Gate: unit tests cover createBuild (creates correct DB records + enqueues capture jobs) and finalizeBuild (correct status aggregation logic).

- [ ] 1.1 Create `packages/services/src/builds.ts`:

  `createBuild({ projectId, branch, commitSha, stories, storybookStaticDir }, callerId)`:
  - Validate project exists
  - `buildsRepo.create({ projectId, branch, commitSha, status: "pending", storybookPath: `builds/${buildId}/storybook` })`
  - Fetch variants for project
  - `snapshotsRepo.createMany(stories × variants)` — one snapshot per combination
  - Upload storybook static dir to storage at `builds/${buildId}/storybook/` (recursive)
  - `enqueueCapture({ buildId, snapshotId })` for every snapshot
  - Return `buildId`

  `finalizeBuild(buildId)`:
  - Fetch all diffs for build
  - If any diff.status === "error" → `buildsRepo.updateStatus(buildId, "error")` → return
  - If any diff.status === "needs_review" → `buildsRepo.updateStatus(buildId, "needs_review")` → return
  - All diffs "auto_approved" or "approved" → `buildsRepo.updateStatus(buildId, "passed")`

- [ ] 1.2 Unit tests (mocked repos + mocked enqueueCapture):
  - `createBuild`: creates build record; creates N×M snapshots; enqueues N×M capture jobs; returns buildId
  - `finalizeBuild`: any error diff → build error; any needs_review → needs_review; all approved → passed
  - `finalizeBuild`: empty diffs array → passed
