import { type ProjectBaselineSnapshotSchema } from "@ovr/api/contracts/snapshots";
import { FolderIcon, GlobeIcon, Icon } from "@ovr/ui/components/icon";
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
import { WarningBadge } from "@/lib/components/WarningBadge";
import { getStoragePath } from "@/lib/utils/storage";

type BaselineSnapshotCardProps = {
  snapshot: ProjectBaselineSnapshotSchema;
};

export const BaselineSnapshotCard = ({ snapshot }: BaselineSnapshotCardProps) => {
  const isFlaky = snapshot.flags.includes("flaky");
  const hasWarning = snapshot.flags.includes("warning");
  const label = `snapshot of ${snapshot.targetTitle} ${snapshot.targetName}, ${snapshot.project.name}, ${snapshot.browser} ${snapshot.viewportName}${hasWarning ? ", has warnings" : ""}${isFlaky ? ", flaky" : ""}`;

  return (
    <CardLink
      href={`/projects/${snapshot.project.id}/builds/${snapshot.buildId}/snapshots/${snapshot.id}`}
      className="gap-0 py-0"
      aria-label={label}
    >
      <SnapshotCardPreview>
        <SnapshotCardImage
          src={getStoragePath(snapshot.imagePath)}
          alt={`snapshot of ${snapshot.targetTitle} ${snapshot.targetName}`}
        />
        {hasWarning || isFlaky ? (
          <SnapshotCardPreviewBadges>
            <SnapshotBadges>
              {hasWarning ? <WarningBadge /> : null}
              {isFlaky ? <FlakyBadge filled /> : null}
            </SnapshotBadges>
          </SnapshotCardPreviewBadges>
        ) : null}
      </SnapshotCardPreview>
      <SnapshotCardBody>
        <Typography variant="code" className="truncate">
          {snapshot.targetName}
        </Typography>
        <Typography variant="caption" className="truncate">
          {snapshot.targetTitle}
        </Typography>
        <MetadataList className="gap-x-3 gap-y-1">
          <MetadataItem icon={<Icon icon={FolderIcon} size={12} className="shrink-0" />}>
            {snapshot.project.name}
          </MetadataItem>
          <MetadataItem icon={<Icon icon={GlobeIcon} size={12} className="shrink-0" />}>
            {snapshot.browser}
          </MetadataItem>
          <MetadataItem
            icon={<ResolutionIcon width={snapshot.viewportWidth} size={12} className="shrink-0" />}
          >
            {snapshot.viewportName}
          </MetadataItem>
        </MetadataList>
      </SnapshotCardBody>
    </CardLink>
  );
};
