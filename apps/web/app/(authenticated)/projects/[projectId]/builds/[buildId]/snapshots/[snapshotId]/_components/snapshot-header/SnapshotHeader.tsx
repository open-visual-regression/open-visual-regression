import type { BuildSchema } from "@ovr/api/contracts/builds";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Alert, AlertDescription, AlertTitle } from "@ovr/ui/components/alert";
import { ExternalLinkIcon, GlobeIcon, Icon } from "@ovr/ui/components/icon";
import { ResolutionIcon } from "@ovr/ui/components/resolution-icon";
import { Typography } from "@ovr/ui/components/typography";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
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
        {storybookHref ? (
          <ButtonLink
            href={storybookHref}
            variant="link"
            color="neutral"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon icon={ExternalLinkIcon} size={10} />
            view story
          </ButtonLink>
        ) : null}
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
