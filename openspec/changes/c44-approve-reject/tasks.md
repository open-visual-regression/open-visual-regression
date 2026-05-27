# 44 · Approve/reject actions

Gate: clicking approve on a diff updates its status; build status recalculates; approving on default branch promotes baseline; bulk approve/reject at run level works.

- [ ] 1.1 Create `apps/web/app/(authenticated)/projects/[slug]/builds/[buildId]/diffs/[diffId]/actions.ts`:
  - `approveDiff(diffId)` Server Action:
    - Validate session
    - Call `reviewService.approveDiff(diffId, session.user.id)`
    - `revalidatePath` for run detail + diff viewer pages
    - Return `{ ok: true }`
  - `rejectDiff(diffId)` Server Action:
    - Same pattern calling `reviewService.rejectDiff`

- [ ] 1.2 Wire Server Actions into `DiffViewer.tsx`:
  - Approve button (primary, "approve") → calls `approveDiff`; shows loading state during call
  - Reject button (destructive, "reject") → calls `rejectDiff`; shows loading state
  - After action resolves: button reflects new status (approved/rejected, disabled + status Badge)
  - `A` keyboard shortcut → same as approve button
  - `R` keyboard shortcut → same as reject button

- [ ] 1.3 Create `apps/web/app/(authenticated)/projects/[slug]/builds/[buildId]/actions.ts`:
  - `approveAll(buildId)` Server Action:
    - Fetch all `needs_review` diffs for build
    - Call `reviewService.approveDiff` for each in sequence
    - `revalidatePath` for run detail
  - `rejectAll(buildId)` Server Action: same pattern

- [ ] 1.4 Wire bulk actions on run detail page (39-run-detail):
  - "approve all" button → calls `approveAll`; disabled when no `needs_review` diffs
  - "reject all" button → calls `rejectAll`; disabled when no `needs_review` diffs

- [ ] 1.5 Component tests:
  - Approve button: calls action; button shows approved state after; A key triggers same
  - Reject button: calls action; button shows rejected state; R key triggers same
  - Already-approved diff: approve + reject buttons both disabled
  - Bulk approve: calls `approveAll`; disabled when no changed diffs
