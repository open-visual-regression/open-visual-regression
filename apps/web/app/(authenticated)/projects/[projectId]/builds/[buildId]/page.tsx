import { notFound } from "next/navigation";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";
import { BuildHeader } from "./_components/build-header/BuildHeader";
import { SnapshotGrid } from "./_components/snapshot-grid/SnapshotGrid";

const PAGE_SIZE = 24;

type BuildPageProps = PageProps<"/projects/[projectId]/builds/[buildId]"> & {
  searchParams: Promise<{ page?: string }>;
};

export default async function BuildPage(props: BuildPageProps) {
  const { projectId, buildId } = await props.params;
  const { page } = await props.searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const [[error, buildResult], [countsError, snapshotCounts], [snapshotsError, snapshotsResult]] =
    await Promise.all([
      serverClient.builds.getOne({ buildId }),
      serverClient.snapshots.getCounts({ buildId }),
      serverClient.snapshots.list({
        buildId,
        limit: PAGE_SIZE,
        offset: (currentPage - 1) * PAGE_SIZE,
      }),
    ]);

  if (
    error?.code === "NOT_FOUND" ||
    countsError?.code === "NOT_FOUND" ||
    snapshotsError?.code === "NOT_FOUND"
  ) {
    notFound();
  }

  if (error || countsError || snapshotsError) {
    serverError();
  }

  return (
    <div className="flex flex-col gap-6">
      <BuildHeader build={buildResult.build} snapshotCounts={snapshotCounts} />
      <SnapshotGrid
        snapshots={snapshotsResult.snapshots}
        projectId={projectId}
        buildId={buildId}
        total={snapshotsResult.total}
        page={currentPage}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
