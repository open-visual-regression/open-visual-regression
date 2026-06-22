import { notFound } from "next/navigation";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";
import { BuildHeader } from "./_components/build-header/BuildHeader";
import { SnapshotGrid, type SnapshotFilter } from "./_components/snapshot-grid/SnapshotGrid";

type BuildPageProps = PageProps<"/projects/[projectId]/builds/[buildId]">;

const isSnapshotFilter = (value: string | string[] | undefined): value is SnapshotFilter =>
  value === "changed" || value === "pass";

export default async function BuildPage(props: BuildPageProps) {
  const { projectId, buildId } = await props.params;
  const searchParams = await props.searchParams;
  const filter: SnapshotFilter = isSnapshotFilter(searchParams.filter)
    ? searchParams.filter
    : "all";

  const [[error, buildResult], [countsError, snapshotCounts]] = await Promise.all([
    serverClient.builds.getOne({ buildId }),
    serverClient.builds.getSnapshotCounts({ buildId }),
  ]);

  if (error?.code === "NOT_FOUND" || countsError?.code === "NOT_FOUND") {
    notFound();
  }

  if (error || countsError) {
    serverError();
  }

  return (
    <div className="flex flex-col gap-6">
      <BuildHeader build={buildResult.build} snapshotCounts={snapshotCounts} />
      <SnapshotGrid
        snapshots={buildResult.snapshots}
        projectId={projectId}
        buildId={buildId}
        filter={filter}
      />
    </div>
  );
}
