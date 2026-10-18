import { type SnapshotHistoryEntrySchema } from "@ovr/api/contracts/snapshots";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { CardLink } from "@/lib/components/card-link/CardLink";
import { CardSurface } from "@/lib/components/card-link/CardSurface";
import { Image } from "@/lib/components/image/Image";
import { MetadataDot } from "@/lib/components/metadata-dot/MetadataDot";
import { SnapshotBadges } from "@/lib/components/SnapshotBadges";
import { getSnapshotStatusLabel, SnapshotStatusBadge } from "@/lib/components/SnapshotStatusBadge";
import { WarningBadge } from "@/lib/components/WarningBadge";
import { formatRelativeDateTime } from "@/lib/utils/date";
import { getStoragePath } from "@/lib/utils/storage";

type SnapshotHistoryCardSlotProps = {
  className?: string;
  children?: React.ReactNode;
};

const SnapshotHistoryCardPreview = ({ className, children }: SnapshotHistoryCardSlotProps) => (
  <div
    className={cn(
      "relative h-40 overflow-hidden border-b border-ovr-border-subtle bg-ovr-inset bg-pixel-grid",
      className,
    )}
  >
    {children}
  </div>
);

const SnapshotHistoryCardBody = ({ className, children }: SnapshotHistoryCardSlotProps) => (
  <div className={cn("flex min-w-0 flex-col gap-1 px-3 py-2.5", className)}>{children}</div>
);

type SnapshotHistoryCardProps = {
  entry: SnapshotHistoryEntrySchema;
  projectId: string;
  current?: boolean;
};

export const SnapshotHistoryCard = ({ entry, projectId, current }: SnapshotHistoryCardProps) => {
  const imagePath = getStoragePath(entry.imagePath);
  const shortSha = entry.commitSha.slice(0, 7);
  const warning = entry.flags.includes("warning");
  const label = `snapshot from ${entry.buildName ?? shortSha}, ${getSnapshotStatusLabel(entry.status)}${warning ? ", has warnings" : ""}`;

  return (
    <CardLink
      href={`/projects/${projectId}/builds/${entry.buildId}/snapshots/${entry.id}`}
      className={cn("gap-0 py-0", current && "border-ovr-accent")}
      aria-label={label}
      aria-current={current ? "page" : undefined}
    >
      <SnapshotHistoryCardPreview>
        {imagePath ? (
          <Image
            src={imagePath}
            alt={`snapshot from ${entry.buildName ?? shortSha}`}
            className="absolute inset-0 h-full w-full object-cover object-top"
            errorFallback={
              <div className="absolute inset-0 flex items-center justify-center">
                <Typography variant="caption">failed to load snapshot</Typography>
              </div>
            }
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Typography variant="caption">no preview</Typography>
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <SnapshotBadges>
            {warning ? <WarningBadge /> : null}
            <SnapshotStatusBadge status={entry.status} filled />
          </SnapshotBadges>
        </div>
      </SnapshotHistoryCardPreview>
      <SnapshotHistoryCardBody>
        <Typography className="truncate">{entry.buildName ?? shortSha}</Typography>
        <div className="flex min-w-0 flex-row items-center gap-1.5">
          <Typography variant="caption">{shortSha}</Typography>
          <MetadataDot />
          <Typography variant="caption" className="truncate">
            {formatRelativeDateTime(new Date(entry.createdAt))}
          </Typography>
          {current ? (
            <>
              <MetadataDot />
              <Typography variant="caption" className="shrink-0">
                this snapshot
              </Typography>
            </>
          ) : null}
        </div>
      </SnapshotHistoryCardBody>
    </CardLink>
  );
};

export const SnapshotHistoryCardSkeleton = ({ className }: { className?: string }) => (
  <CardSurface aria-hidden className={cn("gap-0 py-0", className)}>
    <SnapshotHistoryCardPreview />
    <SnapshotHistoryCardBody>
      <TypographySkeleton className="w-2/3" />
      <TypographySkeleton variant="caption" className="w-1/2" />
    </SnapshotHistoryCardBody>
  </CardSurface>
);
