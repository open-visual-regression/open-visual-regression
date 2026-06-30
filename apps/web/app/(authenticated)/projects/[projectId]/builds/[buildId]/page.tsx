import { z } from "zod";
import { notFound } from "next/navigation";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";
import { BuildHeader } from "./_components/build-header/BuildHeader";
import { SnapshotGrid } from "./_components/snapshot-grid/SnapshotGrid";
import { SnapshotsSearchField } from "./_components/snapshot-grid/SnapshotsSearchField";

const PAGE_SIZE = 60;

type BuildPageProps = PageProps<"/projects/[projectId]/builds/[buildId]">;

const searchParamsSchema = z.object({
  search: z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) => value || undefined),
});

export default async function BuildPage({ params, searchParams }: BuildPageProps) {
  const { projectId, buildId } = await params;
  const { search } = searchParamsSchema.parse(await searchParams);

  const [[error, buildResult], [countsError, snapshotCounts], [snapshotsError, snapshotsResult]] =
    await Promise.all([
      serverClient.builds.getOne({ buildId }),
      serverClient.snapshots.getCounts({ buildId }),
      serverClient.snapshots.list({
        buildId,
        search,
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
      <div className="flex">
        <SnapshotsSearchField
          projectId={projectId}
          buildId={buildId}
          search={search}
          className="w-full md:ml-auto md:w-64"
        />
      </div>
      <SnapshotGrid
        snapshots={snapshotsResult.snapshots}
        projectId={projectId}
        buildId={buildId}
        search={search}
      />
    </div>
  );
}
