import { oc } from "@orpc/contract";
import { z } from "zod";

export const diffReviewVoteSchema = z.enum(["approve", "reject"]);

export const castVoteInputSchema = z.object({ diffId: z.uuidv7(), vote: diffReviewVoteSchema });
export const castVoteContract = oc.input(castVoteInputSchema).output(z.void());

export const removeVoteInputSchema = z.object({
  diffId: z.uuidv7(),
  reviewerId: z.string().min(1).optional(),
});
export const removeVoteContract = oc.input(removeVoteInputSchema).output(z.void());

export const bulkCastVoteInputSchema = z.object({
  buildId: z.uuidv7(),
  vote: diffReviewVoteSchema,
});

export const bulkCastVoteContract = oc.input(bulkCastVoteInputSchema).output(z.void());

export const diffProcessingStatusSchema = z.enum(["pending", "success", "error", "canceled"]);
export const diffReviewStatusSchema = z.enum([
  "not_required",
  "unchanged",
  "auto_approved",
  "needs_review",
  "approved",
  "rejected",
]);

export type DiffReviewStatusSchema = z.infer<typeof diffReviewStatusSchema>;

const REVIEWABLE_DIFF_REVIEW_STATUSES: readonly DiffReviewStatusSchema[] = [
  "needs_review",
  "approved",
  "rejected",
];

export const isDiffReviewable = (reviewStatus: DiffReviewStatusSchema): boolean =>
  REVIEWABLE_DIFF_REVIEW_STATUSES.includes(reviewStatus);

export const diffSchema = z.object({
  id: z.uuidv7(),
  processingStatus: diffProcessingStatusSchema,
  reviewStatus: diffReviewStatusSchema,
  diffImagePath: z.string().nullable(),
  pixelDiffCount: z.number().int().nullable(),
  diffPercent: z.number().nullable(),
  baselineSnapshot: z.object({ imagePath: z.string().nullable() }).nullable(),
});

export type DiffSchema = z.infer<typeof diffSchema>;

export const getOneInputSchema = z.object({ snapshotId: z.uuidv7() });
export const getOneOutputSchema = z.object({ diff: diffSchema.nullable() });
export const getOneContract = oc.input(getOneInputSchema).output(getOneOutputSchema);

export const diffReviewSchema = z.object({
  reviewerId: z.string().min(1),
  name: z.string().min(1),
  image: z.string().nullable(),
  vote: diffReviewVoteSchema,
  reviewedAt: z.string().nonempty(),
});

export type DiffReviewSchema = z.infer<typeof diffReviewSchema>;

export const listReviewsInputSchema = z.object({ snapshotId: z.uuidv7() });
export const listReviewsOutputSchema = z.object({
  reviews: z.array(diffReviewSchema),
  requiredReviewerCount: z.number().int().positive(),
});

export type ListReviewsOutputSchema = z.infer<typeof listReviewsOutputSchema>;

export const listReviewsContract = oc.input(listReviewsInputSchema).output(listReviewsOutputSchema);

export const contract = {
  castVote: castVoteContract,
  removeVote: removeVoteContract,
  bulkCastVote: bulkCastVoteContract,
  getOne: getOneContract,
  listReviews: listReviewsContract,
} as const;
