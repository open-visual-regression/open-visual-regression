import { type BuildSnapshotSchema } from "@ovr/api/contracts/snapshots";
import { FolderIcon, GlobeIcon, Icon, TimerIcon } from "@ovr/ui/components/icon";
import { ResolutionIcon } from "@ovr/ui/components/resolution-icon";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { CardLink } from "@/lib/components/card-link/CardLink";
import { CardSurface } from "@/lib/components/card-link/CardSurface";
import { FlakyBadge } from "@/lib/components/FlakyBadge";
import { Image } from "@/lib/components/image/Image";
import { MetadataItem } from "@/lib/components/metadata-item/MetadataItem";
import { MetadataList } from "@/lib/components/metadata-list/MetadataList";
import { SnapshotBadges } from "@/lib/components/SnapshotBadges";
import { getSnapshotStatusLabel, SnapshotStatusBadge } from "@/lib/components/SnapshotStatusBadge";
import { WarningBadge } from "@/lib/components/WarningBadge";
import { formatDuration } from "@/lib/utils/date";
import { type SnapshotFilters, withSnapshotFilters } from "@/lib/utils/snapshotFilters";
import { getStoragePath } from "@/lib/utils/storage";

type SnapshotCardSlotProps = {
  className?: string;
  children?: React.ReactNode;
};

const SnapshotCardPreview = ({ className, children }: SnapshotCardSlotProps) => (
  <div
    className={cn(
      "relative h-40 overflow-hidden border-b border-ovr-border-subtle bg-ovr-inset bg-pixel-grid",
      className,
    )}
  >
    {children}
  </div>
);

const SnapshotCardBody = ({ className, children }: SnapshotCardSlotProps) => (
  <div className={cn("flex min-w-0 flex-col gap-1 px-3 py-2.5", className)}>{children}</div>
);

type SnapshotCardProps = {
  snapshot: BuildSnapshotSchema;
  filters?: SnapshotFilters;
  showProject?: boolean;
};

export const SnapshotCard = ({ snapshot, filters, showProject = false }: SnapshotCardProps) => {
  const imagePath = getStoragePath(snapshot.imagePath);
  const label = `snapshot of ${snapshot.targetTitle} ${snapshot.targetName}, ${showProject ? `${snapshot.project.name}, ` : ""}${snapshot.browser} ${snapshot.viewportName}, ${getSnapshotStatusLabel(snapshot.status)}${snapshot.hasUncaughtPageError ? ", has warnings" : ""}${snapshot.isFlaky ? ", flaky" : ""}`;

  return (
    <CardLink
      href={withSnapshotFilters(
        `/projects/${snapshot.project.id}/builds/${snapshot.buildId}/snapshots/${snapshot.id}`,
        filters,
      )}
      className="gap-0 py-0"
      aria-label={label}
    >
      <SnapshotCardPreview>
        {imagePath ? (
          <Image
            src={imagePath}
            alt={`snapshot of ${snapshot.targetTitle} ${snapshot.targetName}`}
            className="absolute inset-0 h-full w-full object-cover"
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
            {snapshot.hasUncaughtPageError ? <WarningBadge /> : null}
            {snapshot.isFlaky ? <FlakyBadge filled /> : null}
            <SnapshotStatusBadge status={snapshot.status} filled />
          </SnapshotBadges>
        </div>
      </SnapshotCardPreview>
      <SnapshotCardBody>
        <Typography variant="code" className="truncate">
          {snapshot.targetName}
        </Typography>
        <Typography variant="caption" className="truncate">
          {snapshot.targetTitle}
        </Typography>
        {showProject ? (
          <Typography variant="caption" className="flex min-w-0 items-center gap-1">
            <Icon icon={FolderIcon} size={12} className="shrink-0" />
            <span className="truncate">{snapshot.project.name}</span>
          </Typography>
        ) : null}
        <MetadataList className="gap-x-3 gap-y-1">
          <MetadataItem icon={<Icon icon={GlobeIcon} size={12} className="shrink-0" />}>
            {snapshot.browser}
          </MetadataItem>
          <MetadataItem
            icon={<ResolutionIcon width={snapshot.viewportWidth} size={12} className="shrink-0" />}
          >
            {snapshot.viewportName}
          </MetadataItem>
          {snapshot.processingMs ? (
            <MetadataItem
              icon={
                <Icon
                  icon={TimerIcon}
                  size={12}
                  className="shrink-0"
                  role="img"
                  aria-label="processing time"
                />
              }
            >
              {formatDuration(snapshot.processingMs)}
            </MetadataItem>
          ) : null}
        </MetadataList>
      </SnapshotCardBody>
    </CardLink>
  );
};

const MetadataItemSkeleton = ({ className }: { className: string }) => (
  <span className="flex items-center gap-1">
    <Skeleton className="size-3 shrink-0" />
    <TypographySkeleton variant="caption" className={className} />
  </span>
);

type SnapshotCardSkeletonProps = {
  className?: string;
  showProject?: boolean;
};

export const SnapshotCardSkeleton = ({
  className,
  showProject = false,
}: SnapshotCardSkeletonProps) => (
  <CardSurface aria-hidden className={cn("gap-0 py-0", className)}>
    <SnapshotCardPreview />
    <SnapshotCardBody>
      <TypographySkeleton variant="code" className="w-2/3" />
      <TypographySkeleton variant="caption" className="w-1/2" />
      {showProject ? <MetadataItemSkeleton className="w-16" /> : null}
      <MetadataList className="gap-x-3 gap-y-1">
        <MetadataItemSkeleton className="w-13" />
        <MetadataItemSkeleton className="w-11" />
        <MetadataItemSkeleton className="w-8" />
      </MetadataList>
    </SnapshotCardBody>
  </CardSurface>
);
