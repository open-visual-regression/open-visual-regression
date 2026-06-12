# 44 · Approve/reject actions

Gate: clicking approve on a diff updates its status; build status recalculates; approving on default branch promotes baseline; bulk approve/reject at run level works.

Depends on: c27-build-schema (diff/snapshot/baseline repos must exist), c31-build-service (`finalizeBuild`), c33-diff-service (`promoteBaseline`)

- [ ] 1.1 `packages/api/src/contracts/diffs.ts`: `approveDiff` + `rejectDiff` + `approveAll` + `rejectAll` contracts (inputs: `{ diffId }` / `{ buildId }`; outputs: void); update `contracts/index.ts`

- [ ] 1.2 `apps/web/lib/router/diffs.ts`: `"use server"`; each handler `.use(authenticatedMiddleware)` + `.actionable()`:
  - `approveDiff(diffId)`:
    - Load diff; if `diff.status !== "needs_review"` → `throw new ORPCError("BAD_REQUEST")`
    - `dbClient.diffs.updateReview(diffId, { reviewerId: context.user.id, reviewedAt: new Date(), status: "approved" })`
    - `promoteBaseline(diffId, context.user.id)` (`@ovr/services/baselines`) — if build's project default branch matches build's branch, upserts baseline
    - If `dbClient.diffs.hasAllDoneForBuild(buildId)` → `finalizeBuild(buildId)` (`@ovr/services/builds`)
  - `rejectDiff(diffId)`:
    - Load diff; if `diff.status !== "needs_review"` → `throw new ORPCError("BAD_REQUEST")`
    - `dbClient.diffs.updateReview(diffId, { reviewerId: context.user.id, reviewedAt: new Date(), status: "rejected" })`
    - If `dbClient.diffs.hasAllDoneForBuild(buildId)` → `finalizeBuild(buildId)` (`@ovr/services/builds`)
  - `approveAll(buildId)`: fetch all `needs_review` diffs for the build; run the `approveDiff` logic for each
  - `rejectAll(buildId)`: same with the `rejectDiff` logic
  - Update `router/index.ts`

- [ ] 1.3 Integration tests (`apps/web/lib/router/__tests__/diffs.integration.test.ts`):
  - `approveDiff` on default branch: approved + baseline promoted + finalize triggered when last
  - `approveDiff` on feature branch: approved + NO baseline promotion + finalize check
  - `rejectDiff`: rejected + no baseline + finalize check
  - Already-decided diff → `BAD_REQUEST`
  - Not last diff: finalize NOT triggered
  - `approveAll` / `rejectAll`: bulk-update all `needs_review` diffs for a build

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
