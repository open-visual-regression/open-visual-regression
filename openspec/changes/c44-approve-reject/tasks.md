# 44 · Approve/reject actions

**Superseded** — single-reviewer design (`diffs.reviewerId`/`reviewedAt`, a single `diff_status` mixing pipeline + verdict, single-vote `updateReview`). The product now requires N distinct reviewers per diff with reject-as-veto, which needs a `diff_reviews` vote table and a split `processingStatus`/`reviewStatus` model instead. Replaced by `c52-reviewer-schema`, `c53-build-finalize-rejected`, `c54-branch-aware-diffing`, `c55-review-voting-service`, `c56-reviewer-api`, and `c57-reviewer-ui`.
