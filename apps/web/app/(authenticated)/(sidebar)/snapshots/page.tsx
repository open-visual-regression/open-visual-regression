import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { Typography } from "@ovr/ui/components/typography";

import { SnapshotsSection } from "@/lib/components/snapshot-grid/SnapshotsSection";
import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";
import { snapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";

import { SnapshotsPageShell } from "./_components/SnapshotsPageShell";

export default async function SnapshotsPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery(
    orpcServer.snapshots.list.infiniteOptions(snapshotsListInfiniteOptions({ sort: "name" })),
  );

  return (
    <SnapshotsPageShell
      heading={
        <Typography variant="h1" as="h1">
          snapshots
        </Typography>
      }
      content={
        <HydrationBoundary state={dehydrate(queryClient)}>
          <SnapshotsSection sort="name" showProject />
        </HydrationBoundary>
      }
    />
  );
}
