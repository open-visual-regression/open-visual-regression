import { notFound } from "next/navigation";

import { Typography } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { SnapshotComparisonSection } from "./_components/snapshot-comparison-section/SnapshotComparisonSection";
import { SnapshotDetail } from "./_components/snapshot-detail/SnapshotDetail";
import { SnapshotHeader } from "./_components/snapshot-header/SnapshotHeader";
import { SnapshotLogs } from "./_components/snapshot-logs/SnapshotLogs";

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
    <SnapshotDetail
      snapshot={snapshot}
      diff={diff}
      projectId={projectId}
      buildId={buildId}
      prevSnapshotId={prevSnapshotId}
      nextSnapshotId={nextSnapshotId}
      position={position}
      total={total}
      sidebar={<Typography variant="caption">Logs and comments coming soon.</Typography>}
    >
      <SnapshotHeader snapshot={snapshot} build={build} />
      <SnapshotLogs logs={snapshot.errorLogs} />
      <SnapshotComparisonSection snapshot={snapshot} diff={diff} />
    </SnapshotDetail>
  );
}
