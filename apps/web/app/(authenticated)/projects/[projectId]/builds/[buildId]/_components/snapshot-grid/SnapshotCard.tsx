import Link from "next/link";
import { Badge } from "@ovr/ui/components/badge";
import { StatusIcon, type StatusVariant } from "@ovr/ui/components/status-icon";
import { Typography } from "@ovr/ui/components/typography";
import { type BuildSnapshotSchema } from "@ovr/api/contracts/builds";

const STATUS_ICON_VARIANT: Record<BuildSnapshotSchema["status"], StatusVariant> = {
  pass: "passed",
  changed: "changed",
  fail: "rejected",
  pending: "pending",
};

const STATUS_LABEL: Record<BuildSnapshotSchema["status"], string> = {
  pass: "pass",
  changed: "changed",
  fail: "failed",
  pending: "pending",
};

type SnapshotCardProps = {
  snapshot: BuildSnapshotSchema;
  projectId: string;
  buildId: string;
};

export const SnapshotCard = ({ snapshot, projectId, buildId }: SnapshotCardProps) => {
  const content = (
    <>
      <div className="relative h-40 overflow-hidden border-b border-ovr-border-subtle bg-ovr-inset bg-pixel-grid">
        {snapshot.imagePath ? (
          <img
            src={`/api/storage/${snapshot.imagePath}`}
            alt={`snapshot of ${snapshot.targetTitle} ${snapshot.targetName}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Typography variant="caption">no preview</Typography>
          </div>
        )}
        {snapshot.diffPercent !== null && snapshot.diffPercent > 0 ? (
          <div className="absolute top-2 left-2">
            <Badge variant="changed" filled>
              Δ {snapshot.diffPercent.toFixed(2)}%
            </Badge>
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-1 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <StatusIcon variant={STATUS_ICON_VARIANT[snapshot.status]} size={11} />
          <Typography variant="code" className="min-w-0 flex-1 truncate text-xs font-medium">
            {snapshot.targetName}
          </Typography>
        </div>
        <Typography variant="caption" className="truncate">
          {snapshot.targetTitle}
        </Typography>
        <Typography variant="caption">{STATUS_LABEL[snapshot.status]}</Typography>
      </div>
    </>
  );

  const cardClassName =
    "flex flex-col overflow-hidden rounded-card border border-ovr-border bg-ovr-elevated";

  if (!snapshot.diffId) {
    return <div className={cardClassName}>{content}</div>;
  }

  return (
    <Link
      href={`/projects/${projectId}/builds/${buildId}/diffs/${snapshot.diffId}`}
      className={`${cardClassName} hover:border-ovr-border-strong focus-visible:border-ovr-accent focus-visible:ring-2 focus-visible:ring-ovr-accent/35 focus-visible:outline-none`}
    >
      {content}
    </Link>
  );
};
