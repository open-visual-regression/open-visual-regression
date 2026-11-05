import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { Typography } from "@ovr/ui/components/typography";

import { SnapshotFilters } from "@/lib/components/snapshot-grid/SnapshotFilters";
import { SnapshotsSearchField } from "@/lib/components/snapshot-grid/SnapshotsSearchField";
import { SnapshotsSection } from "@/lib/components/snapshot-grid/SnapshotsSection";
import { getSnapshotStatusLabel } from "@/lib/components/SnapshotStatusBadge";
import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";
import { snapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";
import { parseSnapshotFilters } from "@/lib/utils/snapshotFilters";

import { SnapshotsPageShell } from "./_components/SnapshotsPageShell";

type SnapshotsPageProps = PageProps<"/snapshots">;

export default async function SnapshotsPage(props: SnapshotsPageProps) {
  const rawSearchParams = await props.searchParams;
  const filters = parseSnapshotFilters(rawSearchParams);
  const { search, statuses, browsers, viewports, flags } = filters;

  const queryClient = getQueryClient();

  const [statusesResult, browsersResult, viewportsResult, flagsResult] = await Promise.all([
    queryClient.fetchQuery(orpcServer.snapshots.listStatuses.queryOptions({ input: {} })),
    queryClient.fetchQuery(orpcServer.snapshots.listBrowsers.queryOptions({ input: {} })),
    queryClient.fetchQuery(orpcServer.snapshots.listViewports.queryOptions({ input: {} })),
    queryClient.fetchQuery(orpcServer.snapshots.listFlags.queryOptions({ input: {} })),
    queryClient.prefetchInfiniteQuery(
      orpcServer.snapshots.list.infiniteOptions(
        snapshotsListInfiniteOptions({ sort: "name" }, filters),
      ),
    ),
  ]);

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
  const flagOptions = flagsResult.flags.map((flag) => ({ value: flag, label: flag }));

  return (
    <SnapshotsPageShell
      heading={
        <Typography variant="h1" as="h1">
          snapshots
        </Typography>
      }
      filters={
        <SnapshotFilters
          statuses={statuses}
          browsers={browsers}
          viewports={viewports}
          flags={flags}
          statusOptions={statusOptions}
          browserOptions={browserOptions}
          viewportOptions={viewportOptions}
          flagOptions={flagOptions}
        />
      }
      search={
        <SnapshotsSearchField
          action="/snapshots"
          search={search}
          searchParams={rawSearchParams}
          className="min-w-0 flex-1 lg:w-64 lg:flex-none"
        />
      }
      content={
        <HydrationBoundary state={dehydrate(queryClient)}>
          <SnapshotsSection sort="name" filters={filters} showProject />
        </HydrationBoundary>
      }
    />
  );
}
