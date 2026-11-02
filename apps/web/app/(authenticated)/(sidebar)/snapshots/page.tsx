import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { Typography } from "@ovr/ui/components/typography";

import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";
import { baselineSnapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";

import { BaselineSnapshotsFilters } from "./_components/BaselineSnapshotsFilters";
import { parseBaselineSnapshotsSearchParams } from "./_components/baselineSnapshotsSearchParams";
import { BaselineSnapshotsSection } from "./_components/BaselineSnapshotsSection";
import { SnapshotsPageShell } from "./_components/SnapshotsPageShell";

type SnapshotsPageProps = PageProps<"/snapshots">;

export default async function SnapshotsPage(props: SnapshotsPageProps) {
  const { flags } = parseBaselineSnapshotsSearchParams(await props.searchParams);

  const queryClient = getQueryClient();

  const [flagsResult] = await Promise.all([
    queryClient.fetchQuery(orpcServer.snapshots.listBaselineFlags.queryOptions()),
    queryClient.prefetchInfiniteQuery(
      orpcServer.snapshots.listBaselines.infiniteOptions(
        baselineSnapshotsListInfiniteOptions({ flags }),
      ),
    ),
  ]);

  const flagOptions = flagsResult.flags.map((flag) => ({ value: flag, label: flag }));

  return (
    <SnapshotsPageShell
      heading={
        <Typography variant="h1" as="h1">
          snapshots
        </Typography>
      }
      filters={<BaselineSnapshotsFilters flags={flags} flagOptions={flagOptions} />}
      content={
        <HydrationBoundary state={dehydrate(queryClient)}>
          <BaselineSnapshotsSection flags={flags} />
        </HydrationBoundary>
      }
    />
  );
}
