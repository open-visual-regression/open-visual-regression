# 54 · Branch-aware diff auto-approval

Gate: feature-branch diffs keep today's diffThreshold-based auto-approval for negligible diffs and ask for review above it; main-branch diffs always auto-approve and promote the baseline immediately, with no `awaiting_review` state ever produced; all paths still drive the build toward `finalizeBuild`.

Depends on: c53-build-finalize-rejected

A merge to the main branch means the PR that produced it was already reviewed — so a main-branch build shouldn't make anyone re-review every diff. `reviewStatus: "not_required"` already exists for "no human action needed here" (it's what feature branches use today for negligible diffs); main-branch builds reuse the same value for every diff, rather than introducing a separate meaning for `"approved"`. `"approved"`/`"rejected"` stay reserved as outcomes of the vote-counting flow added in c55-review-voting-service, reachable only from `"awaiting_review"`.

- [x] 1.1 `packages/services/src/snapshots.ts`: rewrite `diffSnapshot(snapshotId, diffId)`:
  - Load snapshot/build/project as today
  - `const isMainBranch = build.branch === project.gitMainBranch;`
  - **Main branch**: regardless of whether a baseline exists, dimensions match, or `diffPercent` — set `processingStatus: "diffed"`, `reviewStatus: "not_required"` (computing `pixelDiffCount`/`diffPercent` when a same-dimension baseline exists, omitting them otherwise), then call `promoteBaseline(diffId, build.createdBy)` (`@ovr/services/baselines`) before `checkAllDoneAndFinalize`
  - **Feature branch** (unchanged threshold semantics, new column names):
    - no baseline → `processingStatus: "diffed"`, `reviewStatus: "awaiting_review"`
    - dimension mismatch → `processingStatus: "diffed"`, `reviewStatus: "awaiting_review"`
    - `diffPercent === 0 || diffPercent <= project.diffThreshold` → `processingStatus: "diffed"`, `reviewStatus: "not_required"`
    - otherwise → upload diff image, `processingStatus: "diffed"`, `reviewStatus: "awaiting_review"`
  - All branches end with `await checkAllDoneAndFinalize(build.id)`

- [x] 1.2 `packages/services/src/__tests__/fixtures.ts`: add a `featureBuild` fixture alongside `build`, identical except `branch: "feature/test"`, for tests that need a non-main-branch build

- [x] 1.3 `packages/services/src/__tests__/snapshots.integration.test.ts`:
  - Switch the existing 3 `diffSnapshot` tests (no baseline → review needed; same-as-baseline → auto-approved; differs-from-baseline → review needed) to use the `featureBuild` fixture, since they exercise threshold-gated behavior; update assertions from `status` to `processingStatus`/`reviewStatus` (`"awaiting_review"` / `"not_required"`)
  - Add: "promotes the baseline and skips review entirely for a main-branch build with no prior baseline" (uses default `build` fixture, branch `"main"`) — asserts `reviewStatus: "not_required"`, `processingStatus: "diffed"`, and that `dbClient.baselines.find(...)` now points at the new snapshot
  - Add: "promotes the baseline and skips review for a main-branch build even when the diff is large" — same as above but with a baseline present and a large pixel difference; asserts `reviewStatus: "not_required"` (not `"awaiting_review"`) and the baseline snapshot was replaced
