import { type BuildDetailSchema, type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { Alert, AlertDescription, AlertTitle } from "@ovr/ui/components/alert";
import {
  Icon,
  CircleSlash2Icon,
  ExternalLinkIcon,
  GitBranchIcon,
  GitCommitHorizontalIcon,
  UserIcon,
} from "@ovr/ui/components/icon";
import { SegmentedProgress } from "@ovr/ui/components/segmented-progress";
import { Typography } from "@ovr/ui/components/typography";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { formatRelativeDateTime } from "@/lib/utils/date";

import { BuildApproveButton } from "./BuildApproveButton";
import { BuildCancelButton } from "./BuildCancelButton";
import { BuildRejectButton } from "./BuildRejectButton";
import { BuildStatusStream } from "./BuildStatusStream";

export type BuildHeaderProps = {
  build: BuildDetailSchema;
  snapshotCounts: Record<SnapshotDisplayStatus, number>;
  storybookHref: string | null;
};

export const BuildHeader = ({ build, snapshotCounts, storybookHref }: BuildHeaderProps) => {
  const total = Object.values(snapshotCounts).reduce((sum, count) => sum + count, 0);
  const hasReviewable =
    snapshotCounts.approved + snapshotCounts.rejected + snapshotCounts.needs_review > 0;
  const isCancelable = build.status === "queued" || build.status === "processing";
  const isCanceled = build.status === "canceled";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row items-start gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Typography variant="h1" as="h1">
            {build.name}
          </Typography>
          <div className="flex flex-row flex-wrap items-center gap-4 text-xs">
            <BuildStatusStream buildId={build.id} initialStatus={build.status} />
            {storybookHref ? (
              <ButtonLink
                href={storybookHref}
                variant="link"
                color="neutral"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon icon={ExternalLinkIcon} size={10} />
                view storybook
              </ButtonLink>
            ) : null}
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
            {isCanceled && build.canceledBy ? (
              <Typography variant="caption" className="flex items-center gap-1">
                <Icon icon={CircleSlash2Icon} size={10} />
                canceled by {build.canceledBy}
              </Typography>
            ) : null}
          </div>
        </div>
        <div className="flex flex-row gap-2">
          {isCancelable ? (
            <BuildCancelButton buildId={build.id} />
          ) : isCanceled ? null : (
            <>
              <BuildRejectButton
                buildId={build.id}
                rejected={build.status === "rejected"}
                disabled={!hasReviewable}
              />
              <BuildApproveButton
                buildId={build.id}
                approved={build.status === "approved"}
                disabled={!hasReviewable}
              />
            </>
          )}
        </div>
      </div>
      {build.errorMessage ? (
        <Alert color="red">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{build.errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      {total > 0 ? (
        <SegmentedProgress
          title={`${total} snapshots`}
          segments={[
            { label: "unchanged", count: snapshotCounts.unchanged, color: "blue" },
            { label: "auto approved", count: snapshotCounts.auto_approved, color: "green" },
            { label: "approved", count: snapshotCounts.approved, color: "green" },
            { label: "needs review", count: snapshotCounts.needs_review, color: "amber" },
            { label: "rejected", count: snapshotCounts.rejected, color: "red" },
            { label: "error", count: snapshotCounts.error, color: "red" },
            { label: "canceled", count: snapshotCounts.canceled, color: "gray" },
            { label: "processing", count: snapshotCounts.processing, color: "purple" },
            { label: "queued", count: snapshotCounts.queued, color: "gray" },
          ]}
        />
      ) : null}
    </div>
  );
};
