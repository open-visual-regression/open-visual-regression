import { notFound } from "next/navigation";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";
import { RunHeader } from "@/lib/components/run-header/RunHeader";
import { SnapshotGrid, type SnapshotFilter } from "@/lib/components/snapshot-grid/SnapshotGrid";
import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";

type BuildPageProps = PageProps<"/projects/[projectId]/builds/[buildId]">;

const isSnapshotFilter = (value: string | string[] | undefined): value is SnapshotFilter =>
  value === "changed" || value === "pass";

export default async function BuildPage(props: BuildPageProps) {
  const { projectId, buildId } = await props.params;
  const searchParams = await props.searchParams;
  const filter: SnapshotFilter = isSnapshotFilter(searchParams.filter)
    ? searchParams.filter
    : "all";

  const [error, result] = await serverClient.builds.getOne({ buildId });

  if (error?.code === "NOT_FOUND") {
    notFound();
  }

  if (error) {
    serverError();
  }

  const snapshotCounts = result.snapshots.reduce(
    (counts, snapshot) => {
      counts[snapshot.status] += 1;
      return counts;
    },
    { pass: 0, changed: 0, fail: 0, pending: 0 } as Record<SnapshotDisplayStatus, number>,
  );

  return (
    <div className="flex flex-col gap-6">
      <RunHeader build={result.build} snapshotCounts={snapshotCounts} />
      <SnapshotGrid
        snapshots={result.snapshots}
        projectId={projectId}
        buildId={buildId}
        filter={filter}
      />
    </div>
  );
}
