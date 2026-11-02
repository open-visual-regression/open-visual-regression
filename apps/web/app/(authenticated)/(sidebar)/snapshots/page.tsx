import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { Typography } from "@ovr/ui/components/typography";

import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";
import { baselineSnapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";

import { BaselineSnapshotsFilters } from "./_components/BaselineSnapshotsFilters";
import { parseBaselineSnapshotsSearchParams } from "./_components/baselineSnapshotsSearchParams";
import { BaselineSnapshotsSection } from "./_components/BaselineSnapshotsSection";
import { SnapshotsPageShell } from "./_components/SnapshotsPageShell";

// The most projects the contract returns in one page.
const PROJECT_OPTIONS_LIMIT = 100;

type SnapshotsPageProps = PageProps<"/snapshots">;

export default async function SnapshotsPage(props: SnapshotsPageProps) {
  const { projectIds, flags } = parseBaselineSnapshotsSearchParams(await props.searchParams);

  const queryClient = getQueryClient();

  const [projectsResult, flagsResult] = await Promise.all([
    queryClient.fetchQuery(
      orpcServer.projects.list.queryOptions({ input: { limit: PROJECT_OPTIONS_LIMIT } }),
    ),
    queryClient.fetchQuery(orpcServer.snapshots.listBaselineFlags.queryOptions()),
    queryClient.prefetchInfiniteQuery(
      orpcServer.snapshots.listBaselines.infiniteOptions(
        baselineSnapshotsListInfiniteOptions({ projectIds, flags }),
      ),
    ),
  ]);

  const projectOptions = projectsResult.projects.map((project) => ({
    value: project.id,
    label: project.name,
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
        <BaselineSnapshotsFilters
          projectIds={projectIds}
          flags={flags}
          projectOptions={projectOptions}
          flagOptions={flagOptions}
        />
      }
      content={
        <HydrationBoundary state={dehydrate(queryClient)}>
          <BaselineSnapshotsSection projectIds={projectIds} flags={flags} />
        </HydrationBoundary>
      }
    />
  );
}
