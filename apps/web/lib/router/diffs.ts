"use server";

import { ORPCError } from "@orpc/client";
import { dbClient } from "@ovr/db/client";
import {
  bulkCastVote as bulkCastVoteService,
  castVote as castVoteService,
  removeVote as removeVoteService,
} from "@ovr/reviews/diffs";

import { os } from "./os";
import { authenticatedMiddleware, organizationSnapshotMiddleware } from "./middleware";

const throwOnError = (error: "DIFF_NOT_FOUND" | "REVIEW_NOT_REQUIRED"): never => {
  if (error === "DIFF_NOT_FOUND") {
    throw new ORPCError("NOT_FOUND");
  }
  throw new ORPCError("BAD_REQUEST");
};

export const castVote = os.diffs.castVote
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const result = await castVoteService(input.diffId, context.user.id, input.vote);

    if (result.status === "error") {
      throwOnError(result.error);
    }
  })
  .actionable();

export const removeVote = os.diffs.removeVote
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const result = await removeVoteService(input.diffId, context.user.id);

    if (result.status === "error") {
      throwOnError(result.error);
    }
  })
  .actionable();

export const bulkCastVote = os.diffs.bulkCastVote
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    await bulkCastVoteService(input.buildId, context.user.id, input.vote);
  })
  .actionable();

export const getOne = os.diffs.getOne
  .use(authenticatedMiddleware)
  .use(organizationSnapshotMiddleware)
  .handler(async ({ context }) => {
    const row = await dbClient.diffs.findBySnapshotWithBaseline(context.snapshot.id);

    return {
      diff: row
        ? {
            id: row.diff.id,
            processingStatus: row.diff.processingStatus,
            reviewStatus: row.diff.reviewStatus,
            diffImagePath: row.diff.diffImagePath,
            pixelDiffCount: row.diff.pixelDiffCount,
            diffPercent: row.diff.diffPercent,
            baselineSnapshot: row.baselineSnapshot
              ? { imagePath: row.baselineSnapshot.imagePath }
              : null,
          }
        : null,
    };
  })
  .actionable();
