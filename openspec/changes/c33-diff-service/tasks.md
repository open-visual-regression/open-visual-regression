# 33 · Diff service + baselines

Gate: unit tests verify threshold logic (auto_approved vs needs_review), no-baseline case, and baseline promotion rules.

- [ ] 1.1 Install `pixelmatch`, `pngjs` in `packages/services`
- [ ] 1.2 Add to `packages/services/src/snapshots.ts`:

  `diffSnapshot(snapshotId, diffId)`:
  - Load snapshot + diff + build + project (for `diffThreshold`) from repos
  - Load baseline via `baselinesRepo.find(project.id, snapshot.captureConfigurationId, snapshot.storyId)`
  - **No baseline**: `diffsRepo.updateStatus(diffId, "needs_review")`; check if all diffs done → enqueue finalize; return
  - Fetch snapshot image from storage (Buffer); fetch baseline image from storage (Buffer)
  - Run Pixelmatch: `pixelmatch(baselinePixels, capturePixels, diffPixels, w, h, { threshold: project.diffThreshold / 100 })`
  - Calculate `diffPercent = pixelDiffCount / (w * h) * 100`
  - If `diffPercent === 0` OR within threshold: `diffsRepo.updateStatus(diffId, "auto_approved")`
  - If exceeds threshold: upload diff PNG to `builds/${buildId}/diffs/${diffId}.png`; `diffsRepo.updateStatus(diffId, "needs_review")` + store `pixelDiffCount` + `diffPercent` + `diffImagePath`
  - Check `diffsRepo.hasAllDoneForBuild(buildId)` → if true, `enqueueFinalize({ buildId })`

- [ ] 1.3 Create `packages/services/src/baselines.ts`:

  `getBaseline(projectId, captureConfigurationId, storyId)`:
  - `baselinesRepo.find(projectId, captureConfigurationId, storyId)`

  `promoteBaseline(diffId, approverId)`:
  - Load diff → snapshot → build
  - Only promote if `build.branch === project.defaultBranch`; if not, return early (feature branch)
  - `baselinesRepo.upsert({ projectId, captureConfigurationId: snapshot.captureConfigurationId, storyId: snapshot.storyId, snapshotId: snapshot.id, approvedBy: approverId })`

- [ ] 1.4 Unit tests:
  - No baseline → needs_review; finalize enqueued if last diff
  - Within threshold → auto_approved
  - Exceeds threshold → needs_review + diff image uploaded
  - `promoteBaseline` on default branch → upserts baseline
  - `promoteBaseline` on feature branch → no upsert (returns early)
