import { notFound } from "next/navigation";
import { z } from "zod";

import { snapshotDisplayStatusSchema } from "@ovr/api/contracts/builds";

import { canReview } from "@/lib/auth/roles";
import { getCachedSession } from "@/lib/auth/session";
import { getSnapshotStatusLabel } from "@/lib/components/SnapshotStatusBadge";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";
import { getStorybookPath, hasHostedStorybook } from "@/lib/utils/storage";

import { BuildHeader } from "./_components/build-header/BuildHeader";
import { BuildPageShell } from "./_components/BuildPageShell";
import { SnapshotFilters } from "./_components/snapshot-grid/SnapshotFilters";
import { SnapshotGrid } from "./_components/snapshot-grid/SnapshotGrid";
import { SnapshotsSearchField } from "./_components/snapshot-grid/SnapshotsSearchField";

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
  browser: z.preprocess(toArray, z.array(z.string())).optional().catch(undefined),
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
    session,
    [error, buildResult],
    [countsError, snapshotCounts],
    [statusesError, statusesResult],
    [browsersError, browsersResult],
    [viewportsError, viewportsResult],
    [snapshotsError, snapshotsResult],
  ] = await Promise.all([
    getCachedSession(),
    serverClient.builds.getOne({ buildId }),
    serverClient.snapshots.getCounts({ buildId }),
    serverClient.snapshots.listStatuses({ buildId }),
    serverClient.snapshots.listBrowsers({ buildId }),
    serverClient.snapshots.listViewports({ buildId }),
    serverClient.snapshots.list({
      buildId,
      statuses,
      browsers,
      viewports,
      search,
      limit: PAGE_SIZE,
      offset: 0,
    }),
  ]);

  if (
    error?.code === "NOT_FOUND" ||
    countsError?.code === "NOT_FOUND" ||
    statusesError?.code === "NOT_FOUND" ||
    browsersError?.code === "NOT_FOUND" ||
    viewportsError?.code === "NOT_FOUND" ||
    snapshotsError?.code === "NOT_FOUND"
  ) {
    notFound();
  }

  if (error || countsError || statusesError || browsersError || viewportsError || snapshotsError) {
    serverError(
      error || countsError || statusesError || browsersError || viewportsError || snapshotsError,
    );
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
          className="min-w-0 flex-1 lg:w-64 lg:flex-none"
        />
      }
      grid={
        <SnapshotGrid
          snapshots={snapshotsResult.snapshots}
          projectId={projectId}
          buildId={buildId}
          search={search}
        />
      }
    />
  );
}
