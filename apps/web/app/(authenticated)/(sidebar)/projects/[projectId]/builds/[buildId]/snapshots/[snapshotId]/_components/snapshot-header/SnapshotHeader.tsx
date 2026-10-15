import type { BuildSchema } from "@ovr/api/contracts/builds";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Alert, AlertDescription, AlertTitle } from "@ovr/ui/components/alert";
import { BadgeSkeleton } from "@ovr/ui/components/badge";
import { GlobeIcon, Icon, TimerIcon } from "@ovr/ui/components/icon";
import { ResolutionIcon } from "@ovr/ui/components/resolution-icon";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { ExternalLink } from "@/lib/components/external-link/ExternalLink";
import { FlakyBadge } from "@/lib/components/FlakyBadge";
import { MetadataItem } from "@/lib/components/metadata-item/MetadataItem";
import { MetadataList } from "@/lib/components/metadata-list/MetadataList";
import { SnapshotStatusBadge } from "@/lib/components/SnapshotStatusBadge";
import { formatDuration } from "@/lib/utils/date";

export type SnapshotHeaderProps = {
  snapshot: SnapshotSchema;
  build: BuildSchema;
  storybookHref: string | null;
  controls?: React.ReactNode;
};

export const SnapshotHeader = ({
  snapshot,
  build,
  storybookHref,
  controls,
}: SnapshotHeaderProps) => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-2">
      <Typography variant="h1" as="h1" className="break-words">
        {snapshot.targetTitle} {snapshot.targetName}
      </Typography>
      <MetadataList>
        <div className="inline-flex gap-1">
          <SnapshotStatusBadge status={snapshot.status} />
          {snapshot.isFlaky ? <FlakyBadge /> : null}
        </div>
        {storybookHref ? <ExternalLink href={storybookHref}>view story</ExternalLink> : null}
        <Typography variant="caption">{build.name}</Typography>
        <MetadataItem icon={<Icon icon={GlobeIcon} size={12} />}>{snapshot.browser}</MetadataItem>
        <MetadataItem icon={<ResolutionIcon width={snapshot.viewportWidth} size={12} />}>
          {snapshot.viewportName}
        </MetadataItem>
        {snapshot.processingMs ? (
          <MetadataItem
            icon={<Icon icon={TimerIcon} size={12} role="img" aria-label="processing time" />}
          >
            {formatDuration(snapshot.processingMs)}
          </MetadataItem>
        ) : null}
        {controls}
      </MetadataList>
    </div>
    {snapshot.status === "error" ? (
      <Alert color="red">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {snapshot.errorMessage ?? "This snapshot failed to capture."}
        </AlertDescription>
      </Alert>
    ) : snapshot.hasUncaughtPageError ? (
      <Alert color="amber">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          This story rendered with an uncaught error. See the logs for details.
        </AlertDescription>
      </Alert>
    ) : null}
  </div>
);

export const SnapshotHeaderSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-2">
      <TypographySkeleton variant="h1" className="w-80 max-w-full" />
      <MetadataList>
        <BadgeSkeleton className="w-24" />
        <TypographySkeleton variant="caption" className="w-24" />
        <TypographySkeleton variant="caption" className="w-20" />
        <TypographySkeleton variant="caption" className="w-32" />
        <TypographySkeleton variant="caption" className="w-36" />
      </MetadataList>
    </div>
  </div>
);
