import { SegmentedProgress } from "@ovr/ui/components/segmented-progress";
import { Alert, AlertDescription, AlertTitle } from "@ovr/ui/components/alert";
import { Typography } from "@ovr/ui/components/typography";
import { Icon, GitBranchIcon, GitCommitHorizontalIcon, UserIcon } from "@ovr/ui/components/icon";
import { type BuildSchema, type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { formatRelativeDateTime } from "@/lib/utils/date";
import { BuildStatusBadge } from "@/lib/components/BuildStatus";
import { BuildApproveButton } from "./BuildApproveButton";
import { BuildRejectButton } from "./BuildRejectButton";

export type BuildHeaderProps = {
  build: BuildSchema;
  snapshotCounts: Record<SnapshotDisplayStatus, number>;
};

export const BuildHeader = ({ build, snapshotCounts }: BuildHeaderProps) => {
  const total = Object.values(snapshotCounts).reduce((sum, count) => sum + count, 0);
  const hasChanged = snapshotCounts.changed > 0;

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
          <BuildRejectButton
            buildId={build.id}
            rejected={build.status === "rejected"}
            disabled={!hasChanged}
          />
          <BuildApproveButton
            buildId={build.id}
            approved={build.status === "passed"}
            disabled={!hasChanged}
          />
        </div>
      </div>
      {build.errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{build.errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      {total > 0 ? (
        <SegmentedProgress
          title={`${total} snapshots`}
          segments={[
            { label: "pass", count: snapshotCounts.pass, color: "green" },
            { label: "approved", count: snapshotCounts.approved, color: "green" },
            { label: "changed", count: snapshotCounts.changed, color: "orange" },
            { label: "rejected", count: snapshotCounts.rejected, color: "red" },
            { label: "failed", count: snapshotCounts.fail, color: "red" },
            { label: "pending", count: snapshotCounts.pending, color: "blue" },
          ]}
        />
      ) : null}
    </div>
  );
};
