import { oc } from "@orpc/contract";
import { z } from "zod";

export const diffReviewVoteSchema = z.enum(["approve", "reject"]);

export const castVoteInputSchema = z.object({ diffId: z.uuidv7(), vote: diffReviewVoteSchema });
export const castVoteContract = oc.input(castVoteInputSchema).output(z.void());

export const removeVoteInputSchema = z.object({ diffId: z.uuidv7() });
export const removeVoteContract = oc.input(removeVoteInputSchema).output(z.void());

export const bulkCastVoteInputSchema = z.object({
  buildId: z.uuidv7(),
  vote: diffReviewVoteSchema,
});
export const bulkCastVoteContract = oc.input(bulkCastVoteInputSchema).output(z.void());

export const contract = {
  castVote: castVoteContract,
  removeVote: removeVoteContract,
  bulkCastVote: bulkCastVoteContract,
} as const;
