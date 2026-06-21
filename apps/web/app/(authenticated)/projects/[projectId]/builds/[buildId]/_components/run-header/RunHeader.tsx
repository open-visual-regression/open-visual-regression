"use client";

import { useRouter } from "next/navigation";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { SegmentedProgress } from "@ovr/ui/components/segmented-progress";
import { Typography } from "@ovr/ui/components/typography";
import { Icon, GitBranchIcon, GitCommitHorizontalIcon, UserIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";
import { type BuildSchema, type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { formatRelativeDateTime } from "@/lib/utils/date";
import { BuildStatusBadge } from "@/lib/components/BuildStatus";
import { ApproveButton } from "@/lib/components/review-actions/ApproveButton";
import { RejectButton } from "@/lib/components/review-actions/RejectButton";
import { serverClient } from "@/lib/router";

export type RunHeaderProps = {
  build: BuildSchema;
  snapshotCounts: Record<SnapshotDisplayStatus, number>;
};

export const RunHeader = ({ build, snapshotCounts }: RunHeaderProps) => {
  const router = useRouter();
  const total = Object.values(snapshotCounts).reduce((sum, count) => sum + count, 0);
  const hasChanged = snapshotCounts.changed > 0;

  const { execute: approveAll, status: approveStatus } = useServerAction(
    serverClient.diffs.bulkCastVote,
    {
      interceptors: [
        onSuccess(() => router.refresh()),
        onError((err) => {
          toast.error(err.message);
        }),
      ],
    },
  );

  const { execute: rejectAll, status: rejectStatus } = useServerAction(
    serverClient.diffs.bulkCastVote,
    {
      interceptors: [
        onSuccess(() => router.refresh()),
        onError((err) => {
          toast.error(err.message);
        }),
      ],
    },
  );

  const isApproved = build.status === "passed";
  const isRejected = build.status === "rejected";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row items-start gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Typography variant="h1" as="h1">
            {build.name}
          </Typography>
          <div className="flex flex-row flex-wrap items-center gap-4 text-xs">
            <BuildStatusBadge status={build.status} />
            <Typography variant="caption" className="flex items-center gap-1">
              <Icon icon={GitBranchIcon} size={10} />
              {build.branch}
            </Typography>
            <Typography variant="caption" className="flex items-center gap-1">
              <Icon icon={GitCommitHorizontalIcon} size={10} />
              {build.commitSha.slice(0, 7)}
            </Typography>
            {build.author ? (
              <Typography variant="caption" className="flex items-center gap-1">
                <Icon icon={UserIcon} size={10} />
                {build.author}
              </Typography>
            ) : null}
            <Typography variant="caption">
              {formatRelativeDateTime(new Date(build.createdAt))}
            </Typography>
          </div>
        </div>
        <div className="flex flex-row gap-2">
          <RejectButton
            rejected={isRejected}
            pending={rejectStatus === "pending"}
            disabled={!hasChanged}
            onClick={() => rejectAll({ buildId: build.id, vote: "reject" })}
            label="reject all"
          />
          <ApproveButton
            approved={isApproved}
            pending={approveStatus === "pending"}
            disabled={!hasChanged}
            onClick={() => approveAll({ buildId: build.id, vote: "approve" })}
            label="approve all"
          />
        </div>
      </div>
      <SegmentedProgress
        title={`${total} snapshots`}
        segments={[
          { label: "pass", count: snapshotCounts.pass, color: "green" },
          { label: "changed", count: snapshotCounts.changed, color: "orange" },
          { label: "rejected", count: snapshotCounts.rejected, color: "red" },
          { label: "failed", count: snapshotCounts.fail, color: "red" },
          { label: "pending", count: snapshotCounts.pending, color: "blue" },
        ]}
      />
    </div>
  );
};
