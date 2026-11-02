import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { Typography } from "@ovr/ui/components/typography";

import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";
import { baselineSnapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";

import { BaselineSnapshotsSection } from "./_components/BaselineSnapshotsSection";
import { SnapshotsPageShell } from "./_components/SnapshotsPageShell";

export default async function SnapshotsPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery(
    orpcServer.snapshots.listBaselines.infiniteOptions(baselineSnapshotsListInfiniteOptions()),
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
          <BaselineSnapshotsSection />
        </HydrationBoundary>
      }
    />
  );
}
