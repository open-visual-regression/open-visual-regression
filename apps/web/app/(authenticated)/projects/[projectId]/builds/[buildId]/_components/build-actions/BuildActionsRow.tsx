import { type BuildDetailSchema, type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { CornerLeftUpIcon } from "@ovr/ui/components/icon";

import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";

import { BuildApproveButton } from "./BuildApproveButton";
import { BuildCancelButton } from "./BuildCancelButton";
import { BuildRejectButton } from "./BuildRejectButton";

export type BuildActionsRowProps = {
  build: BuildDetailSchema;
  snapshotCounts: Record<SnapshotDisplayStatus, number>;
  projectId: string;
  canReview: boolean;
};

export const BuildActionsRow = ({
  build,
  snapshotCounts,
  projectId,
  canReview,
}: BuildActionsRowProps) => {
  const hasReviewable =
    snapshotCounts.approved + snapshotCounts.rejected + snapshotCounts.needs_review > 0;
  const isCancelable = build.status === "queued" || build.status === "processing";
  const isCanceled = build.status === "canceled";
  const hasProcessingError = build.status === "error";
  const showActions =
    canReview && (isCancelable || (!isCanceled && !hasProcessingError && hasReviewable));

  return (
    <div className="flex flex-row items-center justify-between gap-2">
      <ResponsiveActionButton href={`/projects/${projectId}`} icon={CornerLeftUpIcon}>
        back
      </ResponsiveActionButton>
      {showActions ? (
        <div className="flex flex-row items-center gap-2">
          {isCancelable ? (
            <BuildCancelButton buildId={build.id} />
          ) : (
            <>
              <BuildRejectButton buildId={build.id} rejected={build.status === "rejected"} />
              <BuildApproveButton buildId={build.id} approved={build.status === "approved"} />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};
