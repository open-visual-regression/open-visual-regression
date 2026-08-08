import type { SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { isDiffAutoApproved } from "@ovr/builds/builds";
import type { DiffDbSchema } from "@ovr/db/repository/diffs";
import type { SnapshotDbSchema } from "@ovr/db/repository/snapshots";

export const getSnapshotDisplayStatus = (
  snapshot: SnapshotDbSchema,
  diff: DiffDbSchema | undefined,
): SnapshotDisplayStatus => {
  if (snapshot.status === "error" || snapshot.hasRenderError) {
    return "error";
  }

  if (snapshot.status === "canceled") {
    return "canceled";
  }

  if (snapshot.status === "queued") {
    return "queued";
  }

  if (snapshot.status === "processing") {
    return "processing";
  }

  if (diff?.processingStatus === "canceled") {
    return "canceled";
  }

  if (!diff || diff.processingStatus === "pending") {
    return "queued";
  }

  if (diff.processingStatus === "error") {
    return "error";
  }

  if (diff.reviewStatus === "rejected") {
    return "rejected";
  }

  if (diff.reviewStatus === "needs_review") {
    return "needs_review";
  }

  if (diff.reviewStatus === "approved") {
    return "approved";
  }

  if (isDiffAutoApproved(diff.baselineSnapshotId, diff.diffPercent, snapshot.diffThreshold)) {
    return "auto_approved";
  }

  return "unchanged";
};
