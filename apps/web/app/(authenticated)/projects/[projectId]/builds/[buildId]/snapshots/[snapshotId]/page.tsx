import { notFound } from "next/navigation";
import { GlobeIcon, Icon } from "@ovr/ui/components/icon";
import { ResolutionIcon } from "@ovr/ui/components/resolution-icon";
import { Typography } from "@ovr/ui/components/typography";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

type SnapshotPageProps = PageProps<"/projects/[projectId]/builds/[buildId]/snapshots/[snapshotId]">;

export default async function DiffPage(props: SnapshotPageProps) {
  const { projectId, buildId, snapshotId } = await props.params;

  const [[buildError, buildResult], [snapshotError, snapshotResult], [diffError, diffResult]] =
    await Promise.all([
      serverClient.builds.getOne({ buildId }),
      serverClient.snapshots.getOne({ snapshotId }),
      serverClient.diffs.getOne({ snapshotId }),
    ]);

  if (
    buildError?.code === "NOT_FOUND" ||
    snapshotError?.code === "NOT_FOUND" ||
    diffError?.code === "NOT_FOUND"
  ) {
    notFound();
  }

  if (buildError || snapshotError || diffError) {
    serverError();
  }

  const { build } = buildResult;
  const { snapshot } = snapshotResult;
  const { diff } = diffResult;

  const imagePath = diff?.diffImagePath ?? snapshot.imagePath;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography variant="h1" as="h1">
          {snapshot.targetTitle} {snapshot.targetName}
        </Typography>
        <Typography variant="caption">{build.name}</Typography>
        <Typography variant="caption" className="flex items-center gap-1">
          <Icon icon={GlobeIcon} size={12} />
          {snapshot.browser} · <ResolutionIcon width={snapshot.viewportWidth} size={12} />
          {snapshot.viewportWidth}×{snapshot.viewportHeight ?? "auto"}
        </Typography>
      </div>

      <div className="relative overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid w-1/2">
        {imagePath ? (
          <img
            src={`/api/storage/${imagePath}`}
            alt={`${diff?.diffImagePath ? "diff" : "snapshot"} of ${snapshot.targetTitle}`}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Typography variant="caption">no preview</Typography>
          </div>
        )}
      </div>

      {snapshot.errorLogs.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-card border border-ovr-border bg-ovr-elevated p-4">
          <Typography variant="label">error logs</Typography>
          <div className="flex flex-col gap-1">
            {snapshot.errorLogs.map((log) => (
              <Typography key={log.id} variant="code" className="text-xs text-ovr-fg-secondary">
                [{log.level}] {log.message}
              </Typography>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
