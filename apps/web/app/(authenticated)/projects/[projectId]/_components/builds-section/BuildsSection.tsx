"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { type BuildStatus } from "@ovr/api/contracts/builds";

import { buildsListInfiniteOptions } from "@/lib/orpc/builds-query";
import { orpc } from "@/lib/orpc/client";

import { BuildsList } from "./BuildsList";
import { NoBuildsSection } from "./NoBuildsSection";

type BuildsSectionProps = {
  projectId: string;
  search?: string;
  statuses?: BuildStatus[];
  branches?: string[];
  authors?: string[];
};

export const BuildsSection = ({
  projectId,
  search,
  statuses,
  branches,
  authors,
}: BuildsSectionProps) => {
  const hasFilters = Boolean(statuses?.length || branches?.length || authors?.length);

  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(
    orpc.builds.list.infiniteOptions(
      buildsListInfiniteOptions(projectId, search, { statuses, branches, authors }),
    ),
  );

  const builds = data?.pages.flatMap((page) => page.builds) ?? [];

  if (!isPending && builds.length === 0 && !search && !hasFilters) {
    return <NoBuildsSection />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <BuildsList
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
