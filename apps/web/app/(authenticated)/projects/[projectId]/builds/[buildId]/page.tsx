import { notFound } from "next/navigation";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";
import { BuildHeader } from "./_components/build-header/BuildHeader";
import { SnapshotGrid } from "./_components/snapshot-grid/SnapshotGrid";

const PAGE_SIZE = 24;

type BuildPageProps = PageProps<"/projects/[projectId]/builds/[buildId]">;

export default async function BuildPage({ params }: BuildPageProps) {
  const { projectId, buildId } = await params;

  const [[error, buildResult], [countsError, snapshotCounts], [snapshotsError, snapshotsResult]] =
    await Promise.all([
      serverClient.builds.getOne({ buildId }),
      serverClient.snapshots.getCounts({ buildId }),
      serverClient.snapshots.list({
        buildId,
        sortBy: [
          { column: "targetTitle", direction: "asc" },
          { column: "targetName", direction: "asc" },
          { column: "browser", direction: "asc" },
          { column: "viewportWidth", direction: "asc" },
        ],
        limit: PAGE_SIZE,
        offset: 0,
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
      <SnapshotGrid snapshots={snapshotsResult.snapshots} projectId={projectId} buildId={buildId} />
    </div>
  );
}
