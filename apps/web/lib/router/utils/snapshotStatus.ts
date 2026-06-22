import type { SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import type { SnapshotDbSchema } from "@ovr/db/repository/snapshots";
import type { DiffDbSchema } from "@ovr/db/repository/diffs";

export const getSnapshotDisplayStatus = (
  snapshot: SnapshotDbSchema,
  diff: DiffDbSchema | undefined,
): SnapshotDisplayStatus => {
  if (snapshot.status === "error" || snapshot.hasRenderError) {
    return "fail";
  }

  if (snapshot.status === "pending" || !diff || diff.processingStatus === "pending") {
    return "pending";
  }

  if (diff.processingStatus === "error") {
    return "fail";
  }

  if (diff.reviewStatus === "rejected") {
    return "rejected";
  }

  if (diff.reviewStatus === "needs_review") {
    return "changed";
  }

  return "pass";
};
