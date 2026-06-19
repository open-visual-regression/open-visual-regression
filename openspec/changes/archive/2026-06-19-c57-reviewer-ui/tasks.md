# 57 · Wire up reviewer UI

Gate: "approve all"/"reject all" on the build page cast the current user's vote across every still-`awaiting_review` diff in the build and refresh the displayed status; "reject all" requires confirmation since it's a veto; project settings can view/edit `requiredReviewerCount`.

Depends on: c56-reviewer-api

No new per-diff detail page — that's a pre-existing, separate gap, out of scope here.

- [x] 1.1 `apps/web/app/(authenticated)/projects/[projectId]/builds/[buildId]/_components/run-header/RunHeader.tsx`: convert to `"use client"`; replace the two disabled buttons:
  - "approve all" → plain `Button`, `useServerAction(serverClient.diffs.bulkCastVote, ...)` called with `{ buildId: build.id, vote: "approve" }`; disabled while `snapshotCounts.changed === 0` or pending
  - "reject all" → plain `Button` calling `bulkCastVote` with `{ buildId: build.id, vote: "reject" }` directly, no confirmation dialog; disabled while `snapshotCounts.changed === 0` or pending

  Deviates from the description above: skips the `AlertDialog` confirmation step for "reject all" — product decision to keep the action a single click.

- [x] 1.2 `apps/web/app/(authenticated)/projects/[projectId]/builds/[buildId]/_components/run-header/__tests__/RunHeader.test.tsx`: update/add cases:
  - both buttons disabled when `snapshotCounts.changed === 0`
  - "approve all" enabled and calls `bulkCastVote` with `vote: "approve"` when `changed > 0`
  - "reject all" enabled and calls `bulkCastVote` with `vote: "reject"` directly (no confirmation dialog) when `changed > 0`

- [x] 1.3 `apps/web/app/(authenticated)/projects/[projectId]/settings/_components/update-project-form/UpdateProjectForm.tsx`:
  - Add `requiredReviewerCount: z.number().int("required reviewer count must be a whole number").min(1, "required reviewer count must be at least 1")` to `updateProjectSchema`
  - Add `requiredReviewerCount` to the `UpdateProjectFormProps` pick and `defaultValues`
  - Add a new `Field` (next to `diffThreshold`/`retentionDays`) with `id="requiredReviewerCount"`, `type="number"`, `step="1"`, registered via `{...register("requiredReviewerCount", { valueAsNumber: true })}`

- [x] 1.4 Update the settings form's existing component test to cover the new field (render with a value, submit, assert `update` is called with `requiredReviewerCount` in the patch)
