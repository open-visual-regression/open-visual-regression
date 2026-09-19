import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { Typography } from "@ovr/ui/components/typography";

import { BuildsSection } from "@/lib/components/builds-section/BuildsSection";
import { buildsListInfiniteOptions } from "@/lib/orpc/builds-query";
import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";

import { BuildsPageShell } from "./_components/BuildsPageShell";

export default async function BuildsPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery(
    orpcServer.builds.list.infiniteOptions(buildsListInfiniteOptions()),
  );

  return (
    <BuildsPageShell
      heading={
        <Typography variant="h1" as="h1">
          builds
        </Typography>
      }
      content={
        <HydrationBoundary state={dehydrate(queryClient)}>
          <BuildsSection />
        </HydrationBoundary>
      }
    />
  );
}
