import { type BuildSnapshotSchema } from "@ovr/api/contracts/snapshots";
import { GlobeIcon, Icon } from "@ovr/ui/components/icon";
import { ResolutionIcon } from "@ovr/ui/components/resolution-icon";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { CardLink } from "@/lib/components/card-link/CardLink";
import { CardSurface } from "@/lib/components/card-link/CardSurface";
import { Image } from "@/lib/components/image/Image";
import { getSnapshotStatusLabel, SnapshotStatusBadge } from "@/lib/components/SnapshotStatusBadge";
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
  projectId: string;
  buildId: string;
};

export const SnapshotCard = ({ snapshot, projectId, buildId }: SnapshotCardProps) => {
  const imagePath = getStoragePath(snapshot.imagePath);
  const label = `snapshot of ${snapshot.targetTitle} ${snapshot.targetName}, ${snapshot.browser} ${snapshot.viewportName}, ${getSnapshotStatusLabel(snapshot.status)}`;

  return (
    <CardLink
      href={`/projects/${projectId}/builds/${buildId}/snapshots/${snapshot.id}`}
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
          <SnapshotStatusBadge status={snapshot.status} filled />
        </div>
      </SnapshotCardPreview>
      <SnapshotCardBody>
        <Typography variant="code" className="truncate">
          {snapshot.targetName}
        </Typography>
        <Typography variant="caption" className="truncate">
          {snapshot.targetTitle}
        </Typography>
        <Typography variant="caption" className="flex items-center gap-1 truncate">
          <Icon icon={GlobeIcon} size={12} className="shrink-0" />
          {snapshot.browser} ·{" "}
          <ResolutionIcon width={snapshot.viewportWidth} size={12} className="shrink-0" />
          {snapshot.viewportName}
        </Typography>
      </SnapshotCardBody>
    </CardLink>
  );
};

export const SnapshotCardSkeleton = ({ className }: { className?: string }) => (
  <CardSurface aria-hidden className={cn("gap-0 py-0", className)}>
    <SnapshotCardPreview />
    <SnapshotCardBody>
      <TypographySkeleton variant="code" className="w-2/3" />
      <TypographySkeleton variant="caption" className="w-1/2" />
      <TypographySkeleton variant="caption" className="w-3/4" />
    </SnapshotCardBody>
  </CardSurface>
);
