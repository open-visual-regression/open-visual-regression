import Link from "next/link";
import { Typography } from "@ovr/ui/components/typography";
import { type BuildSnapshotSchema } from "@ovr/api/contracts/builds";
import { SnapshotStatusBadge } from "@/lib/components/SnapshotStatusBadge";
import { cn } from "@ovr/ui/lib/utils";

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
        {snapshot.status === "changed" || snapshot.status === "fail" ? (
          <div className="absolute bottom-2 right-2">
            <SnapshotStatusBadge status={snapshot.status} />
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-1 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Typography variant="code" className="min-w-0 flex-1 truncate text-xs font-medium">
            {snapshot.targetName}
          </Typography>
        </div>
        <Typography variant="caption" className="truncate">
          {snapshot.targetTitle}
        </Typography>
      </div>
    </>
  );

  const cardClassName =
    "flex flex-col overflow-hidden rounded-card border border-ovr-border bg-ovr-elevated";

  return (
    <Link
      href={`/projects/${projectId}/builds/${buildId}/snapshot/${snapshot.id}`}
      className={cn(
        cardClassName,
        "hover:border-ovr-border-strong focus-visible:border-ovr-accent focus-visible:ring-2 focus-visible:ring-ovr-accent/35 focus-visible:outline-none hover:scale-101 focus-visible:scale-101",
      )}
    >
      {content}
    </Link>
  );
};
