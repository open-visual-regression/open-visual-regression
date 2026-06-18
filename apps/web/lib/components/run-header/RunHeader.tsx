import { Button } from "@ovr/ui/components/button";
import { SegmentedProgress } from "@ovr/ui/components/segmented-progress";
import { Typography } from "@ovr/ui/components/typography";
import { Icon, GitBranchIcon, GitCommitHorizontalIcon, UserIcon } from "@ovr/ui/components/icon";
import { type BuildSchema, type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { formatRelativeDateTime } from "@/lib/utils/date";
import {
  BuildStatusBadge,
  BuildStatusStripe,
} from "@/app/(authenticated)/projects/[projectId]/_components/builds-section/BuildStatus";

type RunHeaderProps = {
  build: BuildSchema;
  snapshotCounts: Record<SnapshotDisplayStatus, number>;
};

export const RunHeader = ({ build, snapshotCounts }: RunHeaderProps) => {
  const total = Object.values(snapshotCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-start gap-4">
        <div className="relative h-14 w-[3px] shrink-0">
          <BuildStatusStripe status={build.status} />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-row items-baseline gap-2">
            <Typography variant="caption">run</Typography>
            <Typography variant="h1" as="h1">
              #{build.id.slice(0, 8)}
            </Typography>
            <BuildStatusBadge status={build.status} />
          </div>
          <div className="flex flex-row items-center gap-5 text-xs">
            <Typography variant="body-muted" className="flex items-center gap-1">
              <Icon icon={GitCommitHorizontalIcon} size={11} />
              {build.commitSha.slice(0, 7)} {build.name ? `· ${build.name}` : null}
            </Typography>
          </div>
          <div className="flex flex-row flex-wrap items-center gap-4 text-xs">
            <Typography variant="caption" className="flex items-center gap-1">
              <Icon icon={GitBranchIcon} size={10} />
              {build.branch}
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
            <Typography variant="caption">
              {total} snapshots · {snapshotCounts.changed} changed
            </Typography>
          </div>
        </div>
        <div className="flex flex-row gap-2">
          <Button variant="secondary" disabled>
            reject all
          </Button>
          <Button disabled>approve all</Button>
        </div>
      </div>
      <div className="rounded-card border border-ovr-border bg-ovr-elevated p-3.5">
        <SegmentedProgress
          title={`${total} snapshots`}
          subtitle="status breakdown"
          segments={[
            { label: "pass", count: snapshotCounts.pass, color: "green" },
            { label: "changed", count: snapshotCounts.changed, color: "orange" },
            { label: "failed", count: snapshotCounts.fail, color: "red" },
            { label: "pending", count: snapshotCounts.pending, color: "blue" },
          ]}
        />
      </div>
    </div>
  );
};
