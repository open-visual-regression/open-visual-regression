# 52 · Multi-reviewer diff schema

Gate: migration applies cleanly; `diffs`/`diff_reviews`/`projects` repositories covered by integration tests against real Postgres; `pnpm check-types` passes.

Depends on: c27-build-schema

Supersedes `c44-approve-reject` (never implemented/archived): that change assumed one reviewer per diff (`diffs.reviewerId`/`reviewedAt`, a single `diff_status` enum mixing pipeline + verdict). We're moving to N-distinct-reviewer approval, which needs a `diff_reviews` vote table and a split status model instead. Delete `openspec/changes/c44-approve-reject` once this lands.

- [x] 1.1 `packages/db/src/schemas/schemas.ts`: add `requiredReviewerCount: integer("required_reviewer_count").notNull().default(1)` to `projects`, alongside `diffThreshold`

- [x] 1.2 `packages/db/src/schemas/builds.ts`:
  ```ts
  buildStatusEnum: add "rejected" → "pending" | "needs_review" | "passed" | "rejected" | "error"

  diffProcessingStatusEnum: "pending" | "diffed" | "error"   // did the pixel-diff computation succeed
  diffReviewStatusEnum: "not_required" | "awaiting_review" | "approved" | "rejected"  // human verdict
  diffReviewVoteEnum: "approve" | "reject"
  ```
  Remove `diffStatusEnum`.

  `diffs` table: remove `status`, `reviewerId`, `reviewedAt`; add
  ```ts
  processingStatus: diffProcessingStatusEnum("processing_status").notNull().default("pending"),
  reviewStatus: diffReviewStatusEnum("review_status").notNull().default("not_required"),
  ```

  New `diffReviews` table:
  ```ts
  diffReviews: id, diffId (FK→diffs cascade), reviewerId (FK→user cascade),
               vote (diffReviewVoteEnum), reviewedAt (defaultNow)
               UNIQUE(diffId, reviewerId)
  ```

- [x] 1.3 `pnpm db:generate`; commit migration

- [x] 1.4 `packages/db/src/repository/diffs.ts`:
  - Replace `updateStatus(id, status)` with `updateProcessingStatus(id, status: DiffProcessingStatus)`
  - Replace `updateResult` input/output to set `processingStatus`, `reviewStatus`, `diffImagePath?`, `pixelDiffCount?`, `diffPercent?`
  - Add `updateReviewStatus(id, reviewStatus: DiffReviewStatus)`
  - Remove `updateReview`
  - `hasAllDoneForBuild(buildId)`: done means `processingStatus !== "pending"` (pipeline finished, independent of review state)

- [x] 1.5 `packages/db/src/repository/diffReviews.ts` (new):
  - `upsertVote(values: { diffId, reviewerId, vote })` → insert with `onConflictDoUpdate` on `(diffId, reviewerId)` setting `vote`, `reviewedAt`
  - `removeVote(diffId, reviewerId)` → delete matching row
  - `findByDiff(diffId)` → all votes for a diff

- [x] 1.6 `packages/db/src/client.ts`: register `diffReviews` repository on `dbClient`

- [x] 1.7 `packages/db/src/repository/projects.ts`: add `requiredReviewerCount` to the `columns` allowlist in `getProject` and `listProjects`

- [x] 1.8 Rewrite `packages/db/src/__tests__/diffs.integration.test.ts`:
  - `create`: defaults to `processingStatus: "pending"`, `reviewStatus: "not_required"`
  - `findById`, `findByBuild` unchanged in shape
  - `updateProcessingStatus`: updates `processingStatus`
  - `updateResult`: updates `processingStatus`/`reviewStatus`/`diffImagePath`/`pixelDiffCount`/`diffPercent`
  - `updateReviewStatus`: updates `reviewStatus`
  - Remove the `updateReview` test
  - `hasAllDoneForBuild`: same cases, keyed off `processingStatus`

- [x] 1.9 New `packages/db/src/__tests__/diffReviews.integration.test.ts`:
  - `upsertVote` creates a vote; calling again for the same `(diffId, reviewerId)` replaces the vote instead of duplicating
  - `removeVote` deletes the row
  - `findByDiff` returns all votes for a diff, none for others

- [x] 1.10 `apps/worker/src/handlers/diff.ts`: update `failed` to call `dbClient.diffs.updateProcessingStatus(job.data.diffId, "error")` instead of the removed `updateStatus`

- [x] 1.11 `apps/worker/src/handlers/__tests__/diff.integration.test.ts`: update assertions from `{ status: "error" }` to `{ processingStatus: "error" }` to match the renamed column
