import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon, Icon } from "@ovr/ui/components/icon";
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
      <Link
        href={`/projects/${projectId}/builds/${buildId}`}
        className="flex items-center gap-1 text-ovr-fg-secondary hover:text-ovr-fg-primary"
      >
        <Icon icon={ChevronLeftIcon} size={14} />
        <Typography variant="caption">back to {build.name}</Typography>
      </Link>

      <div className="flex flex-col gap-1">
        <Typography variant="h1" as="h1">
          {snapshot.targetTitle}
        </Typography>
        <Typography variant="caption">
          {snapshot.targetName} · {snapshot.captureConfiguration.name} ·{" "}
          {snapshot.captureConfiguration.browser} · {snapshot.captureConfiguration.viewportWidth}×
          {snapshot.captureConfiguration.viewportHeight}
        </Typography>
      </div>

      <div className="relative min-h-80 overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid">
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
