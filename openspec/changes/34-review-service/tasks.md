# 34 · Review service

Gate: unit tests confirm approveDiff promotes baseline on default branch but not feature branch; rejectDiff never promotes; both trigger build finalization check.

- [ ] 1.1 Create `packages/services/src/reviews.ts`:

  `approveDiff(diffId, reviewerId)`:
  - Load diff; validate `diff.status === "needs_review"` (throw if already decided)
  - `diffsRepo.updateReview(diffId, { reviewerId, reviewedAt: new Date(), status: "approved" })`
  - `promoteBaseline(diffId, reviewerId)` — handles branch check internally
  - Check `diffsRepo.allDoneForBuild(buildId)` → if true, `buildService.finalizeBuild(buildId)`

  `rejectDiff(diffId, reviewerId)`:
  - Load diff; validate `diff.status === "needs_review"`
  - `diffsRepo.updateReview(diffId, { reviewerId, reviewedAt: new Date(), status: "rejected" })`
  - Check `diffsRepo.allDoneForBuild(buildId)` → if true, `buildService.finalizeBuild(buildId)`

- [ ] 1.2 Unit tests (mocked deps):
  - `approveDiff` on default branch: status→approved + baseline promoted + finalize triggered when last
  - `approveDiff` on feature branch: status→approved + NO baseline promotion + finalize check
  - `rejectDiff`: status→rejected + no baseline promotion + finalize check
  - Calling on already-decided diff: throws `AlreadyDecidedError`
  - Not last diff: finalize NOT triggered
