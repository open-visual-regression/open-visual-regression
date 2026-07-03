"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import {
  type BuildStatus,
  type ResolutionFilter,
  type ViewportSchema,
} from "@ovr/api/contracts/builds";

import { buildsListInfiniteOptions } from "@/lib/orpc/builds-query";
import { orpc } from "@/lib/orpc/client";

import { BuildsTable } from "./BuildsTable";
import { NoBuildsSection } from "./NoBuildsSection";

type BuildsSectionProps = {
  projectId: string;
  search?: string;
  status?: BuildStatus[];
  browser?: ViewportSchema["browser"][];
  resolutions?: ResolutionFilter[];
};

export const BuildsSection = ({
  projectId,
  search,
  status,
  browser,
  resolutions,
}: BuildsSectionProps) => {
  const hasFilters = Boolean(status?.length || browser?.length || resolutions?.length);

  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(
    orpc.builds.list.infiniteOptions(
      buildsListInfiniteOptions(projectId, search, {
        statuses: status,
        browsers: browser,
        resolutions,
      }),
    ),
  );

  const builds = data?.pages.flatMap((page) => page.builds) ?? [];

  if (!isPending && builds.length === 0 && !search && !hasFilters) {
    return <NoBuildsSection />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <BuildsTable
        data={builds}
        search={search}
        isLoading={isPending}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
    </div>
  );
};
