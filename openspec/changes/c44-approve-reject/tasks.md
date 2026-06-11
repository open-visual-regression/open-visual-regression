# 44 · Approve/reject actions

Gate: clicking approve on a diff updates its status; build status recalculates; approving on default branch promotes baseline; bulk approve/reject at run level works.

Depends on: c27-build-schema (diff/snapshot/baseline repos must exist)

- [ ] 1.1 `packages/services/src/reviews.ts`:

  `approveDiff(diffId, reviewerId)`:
  - Load diff; throw `AlreadyDecidedError` if `diff.status !== "needs_review"`
  - `db.diffs.updateReview(diffId, { reviewerId, reviewedAt: new Date(), status: "approved" })`
  - `promoteBaseline(diffId, reviewerId)` — if build's project default branch matches build's branch, upsert baseline
  - If `db.diffs.hasAllDoneForBuild(buildId)` → `buildService.finalizeBuild(buildId)`

  `rejectDiff(diffId, reviewerId)`:
  - Load diff; throw `AlreadyDecidedError` if not `needs_review`
  - `db.diffs.updateReview(diffId, { reviewerId, reviewedAt: new Date(), status: "rejected" })`
  - If `db.diffs.hasAllDoneForBuild(buildId)` → `buildService.finalizeBuild(buildId)`

  Unit tests (mocked deps):
  - `approveDiff` on default branch: approved + baseline promoted + finalize triggered when last
  - `approveDiff` on feature branch: approved + NO baseline promotion + finalize check
  - `rejectDiff`: rejected + no baseline + finalize check
  - Already-decided diff: throws `AlreadyDecidedError`
  - Not last diff: finalize NOT triggered

- [ ] 1.2 `packages/api/src/contracts/diffs.ts`: `approveDiff` + `rejectDiff` + `approveAll` + `rejectAll` contracts (inputs: `{ diffId }` / `{ buildId }`; outputs: void); update `contracts/index.ts`

- [ ] 1.3 `apps/web/lib/router/diffs.ts`: `"use server"`;
  - `approveDiff` + `rejectDiff`: validate session; call `reviewsService`; `.actionable()`
  - `approveAll(buildId)`: validate session; fetch all `needs_review` diffs; call `reviewsService.approveDiff` for each; `.actionable()`
  - `rejectAll(buildId)`: same with `rejectDiff`
  - Update `router/index.ts`

- [ ] 1.4 `DiffViewer.tsx` (`"use client"`):
  - Approve button (primary) → `useServerAction(router.diffs.approveDiff, { interceptors: [...] })`; loading state while pending
  - Reject button (destructive) → `useServerAction(router.diffs.rejectDiff, { interceptors: [...] })`
  - After action: button reflects new status (approved/rejected); both disabled
  - `A` key → approve; `R` key → reject

- [ ] 1.5 Bulk actions on run detail page:
  - "approve all" → `useServerAction(router.diffs.approveAll)`; disabled when no `needs_review` diffs
  - "reject all" → `useServerAction(router.diffs.rejectAll)`; disabled when no `needs_review` diffs

- [ ] 1.6 Component tests:
  - Approve button: calls action; shows approved state; A key triggers same
  - Reject button: calls action; shows rejected state; R key triggers same
  - Already-approved diff: both buttons disabled
  - Bulk approve: disabled when no changed diffs; calls action when enabled
