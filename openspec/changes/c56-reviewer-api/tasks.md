# 56 · Reviewer API contracts + router

Gate: `requiredReviewerCount` is readable/writable through the projects API; `castVote`/`removeVote`/`bulkCastVote` are callable Server Actions backed by the c55 service functions; existing build/snapshot display status still reflects review state correctly under the new field names.

Depends on: c55-review-voting-service

- [ ] 1.2 `packages/api/src/contracts/projects.ts`: (`buildStatusSchema` already got `"rejected"` in c53-build-finalize-rejected)
  - Add `requiredReviewerCount: z.number().int().min(1)` to `projectSchema`
  - Add `requiredReviewerCount: z.number().int().min(1).optional()` to `updateProjectInputSchema`'s `patch`

- [ ] 1.3 `packages/db/src/repository/projects.ts`: confirmed in c52-reviewer-schema (1.7) — no further change here, just verify `getProject`/`listProjects` already return `requiredReviewerCount`

- [ ] 1.4 `packages/api/src/contracts/diffs.ts` (new):
  ```ts
  export const diffReviewVoteSchema = z.enum(["approve", "reject"]);

  export const castVoteInputSchema = z.object({ diffId: z.uuidv7(), vote: diffReviewVoteSchema });
  export const castVoteContract = oc.input(castVoteInputSchema).output(z.void());

  export const removeVoteInputSchema = z.object({ diffId: z.uuidv7() });
  export const removeVoteContract = oc.input(removeVoteInputSchema).output(z.void());

  export const bulkCastVoteInputSchema = z.object({ buildId: z.uuidv7(), vote: diffReviewVoteSchema });
  export const bulkCastVoteContract = oc.input(bulkCastVoteInputSchema).output(z.void());

  export const contract = { castVote: castVoteContract, removeVote: removeVoteContract, bulkCastVote: bulkCastVoteContract } as const;
  ```

- [ ] 1.5 `packages/api/src/contracts/contract.ts`: register `diffs: { ...diffsContract }`

- [ ] 1.6 `apps/web/lib/router/diffs.ts` (new): `"use server"`; each handler `.use(authenticatedMiddleware)` + `.actionable()`:
  - `castVote({ diffId, vote })`: calls `castVote(diffId, context.user.id, vote)` (`@ovr/services/diffs`); `DIFF_NOT_FOUND` → `ORPCError("NOT_FOUND")`, `REVIEW_NOT_REQUIRED` → `ORPCError("BAD_REQUEST")`
  - `removeVote({ diffId })`: same error mapping via `removeVote(diffId, context.user.id)`
  - `bulkCastVote({ buildId, vote })`: calls `bulkCastVote(buildId, context.user.id, vote)` (`@ovr/services/diffs`)

- [ ] 1.7 `apps/web/lib/router/index.ts`: register `diffs` on `serverClient`

- [ ] 1.8 `apps/web/lib/router/builds.ts`: update `getSnapshotDisplayStatus` to read the split columns:
  - `snapshot.status === "error" || snapshot.hasRenderError` → `"fail"`
  - `snapshot.status === "pending" || !diff || diff.processingStatus === "pending"` → `"pending"`
  - `diff.processingStatus === "error"` → `"fail"`
  - `diff.reviewStatus === "awaiting_review" || diff.reviewStatus === "rejected"` → `"changed"`
  - otherwise → `"pass"`

- [ ] 1.9 Integration tests (`apps/web/lib/router/__tests__/diffs.integration.test.ts`):
  - `castVote`: approve on an `awaiting_review` diff with `requiredReviewerCount: 1` → diff becomes `approved`; build finalizes when last
  - `castVote`: reject vetoes regardless of existing approvals
  - `castVote`: `REVIEW_NOT_REQUIRED` for a diff that's already `not_required`
  - `removeVote`: clears the caller's vote and recomputes
  - `bulkCastVote`: casts across every `awaiting_review` diff in a build, skips terminal ones
  - `projects.update`: can set and read back `requiredReviewerCount`
