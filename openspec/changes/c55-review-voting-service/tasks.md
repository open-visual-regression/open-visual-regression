# 55 · Review voting service

Gate: casting/removing a vote recomputes a diff's `reviewStatus` from its `diff_reviews` rows (veto on any reject, `requiredReviewerCount` distinct approvals to approve) and re-triggers `finalizeBuild`; bulk voting casts the caller's vote across every `awaiting_review` diff in a build.

Depends on: c54-branch-aware-diffing

This is the primitive layer only — no contracts/router/UI here (that's c56-reviewer-api and c57-reviewer-ui). It exists so both the bulk "approve all"/"reject all" actions and a future per-diff detail page can call the same functions.

- [ ] 1.1 `packages/services/src/diffs.ts` (new):
  ```ts
  export const castVote = async (
    diffId: string,
    reviewerId: string,
    vote: DiffReviewVote,
  ): Promise<Result<void, "DIFF_NOT_FOUND" | "REVIEW_NOT_REQUIRED">> => { ... }

  export const removeVote = async (
    diffId: string,
    reviewerId: string,
  ): Promise<Result<void, "DIFF_NOT_FOUND" | "REVIEW_NOT_REQUIRED">> => { ... }

  export const bulkCastVote = async (
    buildId: string,
    reviewerId: string,
    vote: DiffReviewVote,
  ): Promise<void> => { ... }
  ```
  - `castVote`/`removeVote`: load the diff; `DIFF_NOT_FOUND` if missing; `REVIEW_NOT_REQUIRED` if `diff.reviewStatus === "not_required"` (nothing to vote on — either auto-approved by threshold on a feature branch, or a main-branch diff); otherwise upsert/remove the vote via `dbClient.diffReviews` then recompute
  - Recompute (private helper, not exported): load diff → snapshot → build → project chain (same shape as `promoteBaseline` in `baselines.ts`); read all votes via `dbClient.diffReviews.findByDiff(diffId)`; any `"reject"` vote → `reviewStatus: "rejected"`; else count distinct `"approve"` voters, `>= project.requiredReviewerCount` → `"approved"`, otherwise `"awaiting_review"`; `dbClient.diffs.updateReviewStatus(diffId, reviewStatus)`; then `finalizeBuild(build.id)` (`@ovr/services/builds`) — this is the new finalize call site for review actions, distinct from the existing pipeline call site in `diffSnapshot`
  - `bulkCastVote`: fetch `dbClient.diffs.findByBuild(buildId)`, filter to `reviewStatus === "awaiting_review"`, call `castVote` for each with the given reviewer/vote — terminal-state diffs are left untouched
  - Note: an approved-via-votes diff never promotes the baseline (only main-branch builds do that, in `diffSnapshot`) — feature-branch approvals stay review-only, matching today's behavior

- [ ] 1.2 `packages/services/src/__tests__/diffs.integration.test.ts` (new):
  - `castVote`: approve vote on a fresh `awaiting_review` diff with `requiredReviewerCount: 1` → `reviewStatus: "approved"`; with `requiredReviewerCount: 2` and one approve → stays `"awaiting_review"`; a second distinct reviewer's approve → `"approved"`
  - `castVote`: a single reject immediately sets `"rejected"` even with existing approvals (veto)
  - `castVote`: same reviewer voting twice replaces their vote (e.g. approve then reject → `"rejected"`; reject then approve with enough other approvals → `"approved"`)
  - `castVote`: returns `REVIEW_NOT_REQUIRED` for a diff whose `reviewStatus` is `"not_required"`
  - `castVote`: returns `DIFF_NOT_FOUND` for a missing diff id
  - `removeVote`: removing the only reject reverts `"rejected"` back to `"awaiting_review"` (or `"approved"` if enough other approvals already exist)
  - `castVote`/`removeVote`: triggers `finalizeBuild` — assert the build's status updates when the last `awaiting_review` diff in a build becomes `"approved"`
  - `bulkCastVote`: casts the given vote across every `awaiting_review` diff in the build, leaving already-`"approved"`/`"rejected"`/`"not_required"` diffs untouched
