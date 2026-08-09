import { type BuildDetailSchema, type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { Alert, AlertDescription, AlertTitle } from "@ovr/ui/components/alert";
import { BadgeSkeleton } from "@ovr/ui/components/badge";
import {
  Icon,
  CircleSlash2Icon,
  ExternalLinkIcon,
  GitBranchIcon,
  GitCommitHorizontalIcon,
  UserIcon,
} from "@ovr/ui/components/icon";
import {
  SegmentedProgress,
  SegmentedProgressSkeleton,
} from "@ovr/ui/components/segmented-progress";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { formatRelativeDateTime } from "@/lib/utils/date";

import { BuildApproveButton } from "./BuildApproveButton";
import { BuildCancelButton } from "./BuildCancelButton";
import { BuildRebuildButton } from "./BuildRebuildButton";
import { BuildRejectButton } from "./BuildRejectButton";
import { BuildStatusStream } from "./BuildStatusStream";

export type BuildHeaderProps = {
  build: BuildDetailSchema;
  snapshotCounts: Record<SnapshotDisplayStatus, number>;
  storybookHref: string | null;
  canManageBuild: boolean;
};

export const BuildHeader = ({
  build,
  snapshotCounts,
  storybookHref,
  canManageBuild,
}: BuildHeaderProps) => {
  const total = Object.values(snapshotCounts).reduce((sum, count) => sum + count, 0);
  const hasReviewable =
    snapshotCounts.approved + snapshotCounts.rejected + snapshotCounts.needs_review > 0;
  const isCancelable = build.status === "queued" || build.status === "processing";
  const isCanceled = build.status === "canceled";
  const hasProcessingError = build.status === "error";
  const showCancel = canManageBuild && isCancelable;
  const showRebuild = canManageBuild && !isCancelable && build.isRebuildable;
  const showReviewActions =
    canManageBuild && !isCancelable && !isCanceled && !hasProcessingError && hasReviewable;
  const showActions = showCancel || showRebuild || showReviewActions;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-start md:gap-x-4 md:gap-y-2">
        <Typography variant="h1" as="h1" className="min-w-0 md:order-1 md:flex-1 md:truncate">
          {build.name}
        </Typography>
        <div className="flex flex-row flex-wrap items-center gap-4 text-xs md:order-3 md:basis-full">
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
          {isCanceled ? (
            <Typography variant="caption" className="flex items-center gap-1">
              <Icon icon={CircleSlash2Icon} size={10} />
              canceled by {build.canceledBy ?? "the system"}
            </Typography>
          ) : null}
        </div>
        {showActions ? (
          <div className="flex w-full flex-row gap-2 md:order-2 md:w-auto">
            {showCancel ? <BuildCancelButton buildId={build.id} /> : null}
            {showRebuild ? (
              <BuildRebuildButton buildId={build.id} projectId={build.project.id} />
            ) : null}
            {showReviewActions ? (
              <>
                <BuildRejectButton buildId={build.id} rejected={build.status === "rejected"} />
                <BuildApproveButton buildId={build.id} approved={build.status === "approved"} />
              </>
            ) : null}
          </div>
        ) : null}
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

export const BuildHeaderSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-start md:gap-x-4 md:gap-y-2">
      <TypographySkeleton variant="h1" className="w-72 min-w-0 md:order-1 md:flex-1" />
      <div className="flex w-full flex-row gap-2 md:order-2 md:w-auto">
        <Skeleton className="h-8 flex-1 rounded-md md:w-20 md:flex-none" />
        <Skeleton className="h-8 flex-1 rounded-md md:w-24 md:flex-none" />
      </div>
      <div className="flex flex-row flex-wrap items-center gap-4 text-xs md:order-3 md:basis-full">
        <BadgeSkeleton className="w-20" />
        <TypographySkeleton variant="caption" className="w-24" />
        <TypographySkeleton variant="caption" className="w-16" />
        <TypographySkeleton variant="caption" className="w-20" />
        <TypographySkeleton variant="caption" className="w-24" />
      </div>
    </div>
    <SegmentedProgressSkeleton />
  </div>
);
