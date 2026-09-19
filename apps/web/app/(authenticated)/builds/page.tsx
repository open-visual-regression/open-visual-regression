import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { Typography } from "@ovr/ui/components/typography";

import { BuildsFilters } from "@/lib/components/builds-section/BuildsFilters";
import { BuildsSearchField } from "@/lib/components/builds-section/BuildsSearchField";
import { parseBuildsSearchParams } from "@/lib/components/builds-section/buildsSearchParams";
import { BuildsSection } from "@/lib/components/builds-section/BuildsSection";
import { getBuildStatusLabel } from "@/lib/components/BuildStatus";
import { buildsListInfiniteOptions } from "@/lib/orpc/builds-query";
import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";

import { BuildsPageShell } from "./_components/BuildsPageShell";

type BuildsPageProps = PageProps<"/builds">;

export default async function BuildsPage(props: BuildsPageProps) {
  const rawSearchParams = await props.searchParams;
  const { search, statuses, branches, authors } = parseBuildsSearchParams(rawSearchParams);

  const queryClient = getQueryClient();

  const [statusesResult, branchesResult, authorsResult] = await Promise.all([
    queryClient.fetchQuery(orpcServer.builds.listStatuses.queryOptions({ input: {} })),
    queryClient.fetchQuery(
      orpcServer.builds.listBranches.queryOptions({ input: { search: undefined } }),
    ),
    queryClient.fetchQuery(
      orpcServer.builds.listAuthors.queryOptions({ input: { search: undefined } }),
    ),
    queryClient.prefetchInfiniteQuery(
      orpcServer.builds.list.infiniteOptions(
        buildsListInfiniteOptions({ search, statuses, branches, authors }),
      ),
    ),
  ]);

  const statusOptions = statusesResult.statuses.map((status) => ({
    value: status,
    label: getBuildStatusLabel(status),
  }));
  const branchOptions = branchesResult.branches.map((branch) => ({
    value: branch,
    label: branch,
  }));
  const authorOptions = authorsResult.authors.map((author) => ({
    value: author,
    label: author,
  }));

  return (
    <BuildsPageShell
      heading={
        <Typography variant="h1" as="h1">
          builds
        </Typography>
      }
      filters={
        <BuildsFilters
          statuses={statuses}
          branches={branches}
          authors={authors}
          statusOptions={statusOptions}
          branchOptions={branchOptions}
          authorOptions={authorOptions}
        />
      }
      search={
        <BuildsSearchField
          search={search}
          searchParams={rawSearchParams}
          className="min-w-0 flex-1 lg:w-64 lg:flex-none"
        />
      }
      content={
        <HydrationBoundary state={dehydrate(queryClient)}>
          <BuildsSection
            search={search}
            statuses={statuses}
            branches={branches}
            authors={authors}
          />
        </HydrationBoundary>
      }
    />
  );
}
