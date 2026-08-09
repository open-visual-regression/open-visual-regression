import type { BuildSchema } from "@ovr/api/contracts/builds";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Alert, AlertDescription, AlertTitle } from "@ovr/ui/components/alert";
import { BadgeSkeleton } from "@ovr/ui/components/badge";
import { GlobeIcon, Icon } from "@ovr/ui/components/icon";
import { ResolutionIcon } from "@ovr/ui/components/resolution-icon";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { ExternalLink } from "@/lib/components/external-link/ExternalLink";
import { SnapshotStatusBadge } from "@/lib/components/SnapshotStatusBadge";

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
      <div className="flex flex-row flex-wrap items-center gap-4 text-xs">
        <SnapshotStatusBadge status={snapshot.status} />
        {storybookHref ? <ExternalLink href={storybookHref}>view story</ExternalLink> : null}
        <Typography variant="caption">{build.name}</Typography>
        <Typography variant="caption" className="flex items-center gap-1">
          <Icon icon={GlobeIcon} size={12} />
          {snapshot.browser} · <ResolutionIcon width={snapshot.viewportWidth} size={12} />
          {snapshot.viewportName}
        </Typography>
        {controls}
      </div>
    </div>
    {snapshot.status === "error" ? (
      <Alert color="red">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>This snapshot failed to capture.</AlertDescription>
      </Alert>
    ) : null}
  </div>
);

export const SnapshotHeaderSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-2">
      <TypographySkeleton variant="h1" className="w-80 max-w-full" />
      <div className="flex flex-row flex-wrap items-center gap-4 text-xs">
        <BadgeSkeleton className="w-24" />
        <TypographySkeleton variant="caption" className="w-24" />
        <TypographySkeleton variant="caption" className="w-20" />
        <TypographySkeleton variant="caption" className="w-32" />
      </div>
    </div>
  </div>
);
