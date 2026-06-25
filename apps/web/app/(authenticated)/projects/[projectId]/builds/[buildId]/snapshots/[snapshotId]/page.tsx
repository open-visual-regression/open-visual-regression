import { notFound } from "next/navigation";
import { SnapshotHeader } from "./_components/snapshot-header/SnapshotHeader";
import { SnapshotComparisonSection } from "./_components/snapshot-comparison-section/SnapshotComparisonSection";
import { SnapshotLogs } from "./_components/snapshot-logs/SnapshotLogs";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";
import { SnapshotActionsRow } from "./_components/snapshot-actions/SnapshotActionsRow";

type SnapshotPageProps = PageProps<"/projects/[projectId]/builds/[buildId]/snapshots/[snapshotId]">;

export default async function SnapshotPage(props: SnapshotPageProps) {
  const { projectId, buildId, snapshotId } = await props.params;

  const [
    [buildError, buildResult],
    [snapshotError, snapshotResult],
    [diffError, diffResult],
    [adjacentError, adjacentResult],
  ] = await Promise.all([
    serverClient.builds.getOne({ buildId }),
    serverClient.snapshots.getOne({ snapshotId }),
    serverClient.diffs.getOne({ snapshotId }),
    serverClient.snapshots.getAdjacent({ snapshotId }),
  ]);

  if (
    buildError?.code === "NOT_FOUND" ||
    snapshotError?.code === "NOT_FOUND" ||
    diffError?.code === "NOT_FOUND" ||
    adjacentError?.code === "NOT_FOUND"
  ) {
    notFound();
  }

  if (buildError || snapshotError || diffError || adjacentError) {
    serverError();
  }

  const { build } = buildResult;
  const { snapshot } = snapshotResult;
  const { diff } = diffResult;
  const { prevSnapshotId, nextSnapshotId, position, total } = adjacentResult;

  return (
    <div className="flex flex-col gap-6">
      <SnapshotActionsRow
        diff={diff}
        snapshot={snapshot}
        projectId={projectId}
        buildId={buildId}
        prevSnapshotId={prevSnapshotId}
        nextSnapshotId={nextSnapshotId}
        position={position}
        total={total}
      />
      <SnapshotHeader snapshot={snapshot} build={build} />
      <SnapshotLogs logs={snapshot.errorLogs} />
      <SnapshotComparisonSection snapshot={snapshot} diff={diff} />
    </div>
  );
}
