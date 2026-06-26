import { Alert, AlertDescription, AlertTitle } from "@ovr/ui/components/alert";
import { GlobeIcon, Icon } from "@ovr/ui/components/icon";
import { ResolutionIcon } from "@ovr/ui/components/resolution-icon";
import { Typography } from "@ovr/ui/components/typography";
import type { BuildSchema } from "@ovr/api/contracts/builds";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { SnapshotStatusBadge } from "@/lib/components/SnapshotStatusBadge";

export type SnapshotHeaderProps = {
  snapshot: SnapshotSchema;
  build: BuildSchema;
};

export const SnapshotHeader = ({ snapshot, build }: SnapshotHeaderProps) => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-2">
      <Typography variant="h1" as="h1">
        {snapshot.targetTitle} {snapshot.targetName}
      </Typography>
      <div className="flex flex-row flex-wrap items-center gap-4 text-xs">
        <SnapshotStatusBadge status={snapshot.status} />
        <Typography variant="caption">{build.name}</Typography>
        <Typography variant="caption" className="flex items-center gap-1">
          <Icon icon={GlobeIcon} size={12} />
          {snapshot.browser} · <ResolutionIcon width={snapshot.viewportWidth} size={12} />
          {snapshot.viewportWidth}×{snapshot.viewportHeight ?? "auto"}
        </Typography>
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
