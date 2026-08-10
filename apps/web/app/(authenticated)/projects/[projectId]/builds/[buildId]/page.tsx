import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { z } from "zod";

import { snapshotDisplayStatusSchema } from "@ovr/api/contracts/builds";

import { canReview } from "@/lib/auth/roles";
import { getCachedSession } from "@/lib/auth/session";
import { getSnapshotStatusLabel } from "@/lib/components/SnapshotStatusBadge";
import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";
import { snapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";
import { getStorybookPath, hasHostedStorybook } from "@/lib/utils/storage";

import { BuildHeader } from "./_components/build-header/BuildHeader";
import { BuildPageShell } from "./_components/BuildPageShell";
import { SnapshotFilters } from "./_components/snapshot-grid/SnapshotFilters";
import { SnapshotsSearchField } from "./_components/snapshot-grid/SnapshotsSearchField";
import { SnapshotsSection } from "./_components/snapshot-grid/SnapshotsSection";

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
  browser: z.preprocess(toArray, z.array(z.string())).optional().catch(undefined),
  viewport: z.preprocess(toArray, z.array(z.string())).optional().catch(undefined),
});

export default async function BuildPage({ params, searchParams }: BuildPageProps) {
  const { projectId, buildId } = await params;
  const rawSearchParams = await searchParams;
  const {
    search,
    status: statuses = [],
    browser: browsers = [],
    viewport: viewports = [],
  } = searchParamsSchema.parse(rawSearchParams);

  const queryClient = getQueryClient();

  const [
    session,
    [error, buildResult],
    [countsError, snapshotCounts],
    [statusesError, statusesResult],
    [browsersError, browsersResult],
    [viewportsError, viewportsResult],
  ] = await Promise.all([
    getCachedSession(),
    serverClient.builds.getOne({ buildId }),
    serverClient.snapshots.getCounts({ buildId }),
    serverClient.snapshots.listStatuses({ buildId }),
    serverClient.snapshots.listBrowsers({ buildId }),
    serverClient.snapshots.listViewports({ buildId }),
    queryClient.prefetchInfiniteQuery(
      orpcServer.snapshots.list.infiniteOptions(
        snapshotsListInfiniteOptions(buildId, search, { statuses, browsers, viewports }),
      ),
    ),
  ]);

  if (
    error?.code === "NOT_FOUND" ||
    countsError?.code === "NOT_FOUND" ||
    statusesError?.code === "NOT_FOUND" ||
    browsersError?.code === "NOT_FOUND" ||
    viewportsError?.code === "NOT_FOUND"
  ) {
    notFound();
  }

  if (error || countsError || statusesError || browsersError || viewportsError) {
    serverError(error || countsError || statusesError || browsersError || viewportsError);
  }

  const statusOptions = statusesResult.statuses.map((status) => ({
    value: status,
    label: getSnapshotStatusLabel(status),
  }));
  const browserOptions = browsersResult.browsers.map((browser) => ({
    value: browser,
    label: browser,
  }));
  const viewportOptions = viewportsResult.viewports.map((viewport) => ({
    value: viewport,
    label: viewport,
  }));

  const { build } = buildResult;
  const storybookHref = hasHostedStorybook(build) ? getStorybookPath(build.id) : null;

  return (
    <BuildPageShell
      header={
        <BuildHeader
          build={build}
          snapshotCounts={snapshotCounts}
          storybookHref={storybookHref}
          canManageBuild={canReview(session?.user.role)}
        />
      }
      filters={
        <SnapshotFilters
          statuses={statuses}
          browsers={browsers}
          viewports={viewports}
          statusOptions={statusOptions}
          browserOptions={browserOptions}
          viewportOptions={viewportOptions}
        />
      }
      search={
        <SnapshotsSearchField
          projectId={projectId}
          buildId={buildId}
          search={search}
          searchParams={rawSearchParams}
          className="min-w-0 flex-1 lg:w-64 lg:flex-none"
        />
      }
      grid={
        <HydrationBoundary state={dehydrate(queryClient)}>
          <SnapshotsSection
            projectId={projectId}
            buildId={buildId}
            search={search}
            statuses={statuses}
            browsers={browsers}
            viewports={viewports}
          />
        </HydrationBoundary>
      }
    />
  );
}
