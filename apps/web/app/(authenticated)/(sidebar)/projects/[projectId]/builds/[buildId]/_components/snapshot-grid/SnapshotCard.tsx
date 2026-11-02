import { type BuildSnapshotSchema } from "@ovr/api/contracts/snapshots";
import { GlobeIcon, Icon, TimerIcon } from "@ovr/ui/components/icon";
import { ResolutionIcon } from "@ovr/ui/components/resolution-icon";
import { Typography } from "@ovr/ui/components/typography";

import { CardLink } from "@/lib/components/card-link/CardLink";
import { FlakyBadge } from "@/lib/components/FlakyBadge";
import { MetadataItem } from "@/lib/components/metadata-item/MetadataItem";
import { MetadataList } from "@/lib/components/metadata-list/MetadataList";
import {
  SnapshotCardBody,
  SnapshotCardImage,
  SnapshotCardPreview,
  SnapshotCardPreviewBadges,
} from "@/lib/components/snapshot-grid/SnapshotCardLayout";
import { SnapshotBadges } from "@/lib/components/SnapshotBadges";
import { getSnapshotStatusLabel, SnapshotStatusBadge } from "@/lib/components/SnapshotStatusBadge";
import { WarningBadge } from "@/lib/components/WarningBadge";
import { formatDuration } from "@/lib/utils/date";
import { type SnapshotFilters, withSnapshotFilters } from "@/lib/utils/snapshotFilters";
import { getStoragePath } from "@/lib/utils/storage";

type SnapshotCardProps = {
  snapshot: BuildSnapshotSchema;
  projectId: string;
  buildId: string;
  filters?: SnapshotFilters;
};

export const SnapshotCard = ({ snapshot, projectId, buildId, filters }: SnapshotCardProps) => {
  const imagePath = getStoragePath(snapshot.imagePath);
  const label = `snapshot of ${snapshot.targetTitle} ${snapshot.targetName}, ${snapshot.browser} ${snapshot.viewportName}, ${getSnapshotStatusLabel(snapshot.status)}${snapshot.hasUncaughtPageError ? ", has warnings" : ""}${snapshot.isFlaky ? ", flaky" : ""}`;

  return (
    <CardLink
      href={withSnapshotFilters(
        `/projects/${projectId}/builds/${buildId}/snapshots/${snapshot.id}`,
        filters,
      )}
      className="gap-0 py-0"
      aria-label={label}
    >
      <SnapshotCardPreview>
        <SnapshotCardImage
          src={imagePath}
          alt={`snapshot of ${snapshot.targetTitle} ${snapshot.targetName}`}
        />
        <SnapshotCardPreviewBadges>
          <SnapshotBadges>
            {snapshot.hasUncaughtPageError ? <WarningBadge /> : null}
            {snapshot.isFlaky ? <FlakyBadge filled /> : null}
            <SnapshotStatusBadge status={snapshot.status} filled />
          </SnapshotBadges>
        </SnapshotCardPreviewBadges>
      </SnapshotCardPreview>
      <SnapshotCardBody>
        <Typography variant="code" className="truncate">
          {snapshot.targetName}
        </Typography>
        <Typography variant="caption" className="truncate">
          {snapshot.targetTitle}
        </Typography>
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
