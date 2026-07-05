import { notFound } from "next/navigation";
import { z } from "zod";

import { browserSchema, snapshotDisplayStatusSchema } from "@ovr/api/contracts/builds";

import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";
import { getStorybookPath } from "@/lib/utils/storage";

import { BuildHeader } from "./_components/build-header/BuildHeader";
import { SnapshotFilters } from "./_components/snapshot-grid/SnapshotFilters";
import { SnapshotGrid } from "./_components/snapshot-grid/SnapshotGrid";
import { SnapshotsSearchField } from "./_components/snapshot-grid/SnapshotsSearchField";
import {
  decodeViewportFilterValue,
  encodeViewportFilterValue,
} from "./_components/snapshot-grid/viewportFilterValue";

const PAGE_SIZE = 60;

type BuildPageProps = PageProps<"/projects/[projectId]/builds/[buildId]">;

const toArray = (value: string | string[] | undefined) =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];

const searchParamsSchema = z.object({
  search: z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) => value || undefined),
  status: z.preprocess(toArray, z.array(snapshotDisplayStatusSchema)).optional().catch(undefined),
  browser: z.preprocess(toArray, z.array(browserSchema)).optional().catch(undefined),
  viewport: z.preprocess(toArray, z.array(z.string())).optional().catch(undefined),
});

export default async function BuildPage({ params, searchParams }: BuildPageProps) {
  const { projectId, buildId } = await params;
  const {
    search,
    status: statuses = [],
    browser: browsers = [],
    viewport: viewports = [],
  } = searchParamsSchema.parse(await searchParams);

  const [
    [error, buildResult],
    [countsError, snapshotCounts],
    [viewportsError, viewportsResult],
    [snapshotsError, snapshotsResult],
  ] = await Promise.all([
    serverClient.builds.getOne({ buildId }),
    serverClient.snapshots.getCounts({ buildId }),
    serverClient.snapshots.listViewports({ buildId }),
    serverClient.snapshots.list({
      buildId,
      statuses,
      browsers,
      viewports: viewports.map(decodeViewportFilterValue).filter((viewport) => viewport !== null),
      search,
      limit: PAGE_SIZE,
      offset: 0,
    }),
  ]);

  if (
    error?.code === "NOT_FOUND" ||
    countsError?.code === "NOT_FOUND" ||
    viewportsError?.code === "NOT_FOUND" ||
    snapshotsError?.code === "NOT_FOUND"
  ) {
    notFound();
  }

  if (error || countsError || viewportsError || snapshotsError) {
    serverError();
  }

  const viewportOptions = viewportsResult.viewports.map((viewport) => ({
    value: encodeViewportFilterValue(viewport),
    label: viewport.viewportName,
  }));

  const { build } = buildResult;
  const hasStorybook =
    build.buildType === "storybook" &&
    build.status !== "queued" &&
    build.status !== "processing" &&
    build.status !== "error";
  const storybookHref = hasStorybook ? getStorybookPath(build.id) : null;

  return (
    <div className="flex flex-col gap-6">
      <BuildHeader build={build} snapshotCounts={snapshotCounts} storybookHref={storybookHref} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SnapshotFilters
          statuses={statuses}
          browsers={browsers}
          viewports={viewports}
          viewportOptions={viewportOptions}
        />
        <SnapshotsSearchField
          projectId={projectId}
          buildId={buildId}
          search={search}
          className="min-w-0 flex-1 lg:w-64 lg:flex-none"
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
