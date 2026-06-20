import { notFound } from "next/navigation";
import { SnapshotHeader } from "./_components/snapshot-header/SnapshotHeader";
import { SnapshotComparison } from "./_components/snapshot-comparison/SnapshotComparison";
import { ErrorLogs } from "./_components/error-logs/ErrorLogs";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

type SnapshotPageProps = PageProps<"/projects/[projectId]/builds/[buildId]/snapshots/[snapshotId]">;

export default async function SnapshotPage(props: SnapshotPageProps) {
  const { buildId, snapshotId } = await props.params;

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

  return (
    <div className="flex flex-col gap-6">
      <SnapshotHeader snapshot={snapshot} build={build} />
      <SnapshotComparison snapshot={snapshot} diff={diff} />
      <ErrorLogs logs={snapshot.errorLogs} />
    </div>
  );
}
