import type { DiffSchema } from "@ovr/api/contracts/diffs";
import { SnapshotApproveButton } from "./SnapshotApproveButton";
import { SnapshotRejectButton } from "./SnapshotRejectButton";

export type SnapshotReviewActionsProps = {
  diffId: string;
  reviewStatus: DiffSchema["reviewStatus"];
};

export const SnapshotReviewActions = ({ diffId, reviewStatus }: SnapshotReviewActionsProps) => (
  <div className="flex flex-row gap-2 shrink-0">
    <SnapshotRejectButton diffId={diffId} rejected={reviewStatus === "rejected"} />
    <SnapshotApproveButton diffId={diffId} approved={reviewStatus === "approved"} />
  </div>
);
