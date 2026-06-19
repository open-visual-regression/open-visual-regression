# 57 · Wire up reviewer UI

Gate: "approve all"/"reject all" on the build page cast the current user's vote across every still-`awaiting_review` diff in the build and refresh the displayed status; "reject all" requires confirmation since it's a veto; project settings can view/edit `requiredReviewerCount`.

Depends on: c56-reviewer-api

No new per-diff detail page — that's a pre-existing, separate gap, out of scope here.

- [ ] 1.1 `apps/web/app/(authenticated)/projects/[projectId]/builds/[buildId]/_components/run-header/RunHeader.tsx`: convert to `"use client"`; replace the two disabled buttons:
  - "approve all" → plain `Button`, `useServerAction(serverClient.diffs.bulkCastVote, { interceptors: [onSuccess(() => router.refresh()), onError(...)] })` called with `{ buildId: build.id, vote: "approve" }`; disabled while `snapshotCounts.changed === 0` or pending
  - "reject all" → wrap in `AlertDialog`/`AlertDialogTrigger`/`AlertDialogContent` (pattern: `RevokeApiKeyButton.tsx`) since it's the more destructive action (a single reject vetoes any diff, even ones with existing approvals); confirmation copy along the lines of "reject all changed snapshots? this overrides any existing approvals." `AlertDialogAction variant="destructive"` calls `bulkCastVote` with `{ buildId: build.id, vote: "reject" }`; disabled while `snapshotCounts.changed === 0` or pending

- [ ] 1.2 `apps/web/app/(authenticated)/projects/[projectId]/builds/[buildId]/_components/run-header/__tests__/RunHeader.test.tsx`: update/add cases:
  - both buttons disabled when `snapshotCounts.changed === 0`
  - "approve all" enabled and calls `bulkCastVote` with `vote: "approve"` when `changed > 0`
  - "reject all" opens a confirmation dialog; confirming calls `bulkCastVote` with `vote: "reject"`

- [ ] 1.3 `apps/web/app/(authenticated)/projects/[projectId]/settings/_components/update-project-form/UpdateProjectForm.tsx`:
  - Add `requiredReviewerCount: z.number().int("required reviewer count must be a whole number").min(1, "required reviewer count must be at least 1")` to `updateProjectSchema`
  - Add `requiredReviewerCount` to the `UpdateProjectFormProps` pick and `defaultValues`
  - Add a new `Field` (next to `diffThreshold`/`retentionDays`) with `id="requiredReviewerCount"`, `type="number"`, `step="1"`, registered via `{...register("requiredReviewerCount", { valueAsNumber: true })}`

- [ ] 1.4 Update the settings form's existing component test to cover the new field (render with a value, submit, assert `update` is called with `requiredReviewerCount` in the patch)
