"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { buildsListInfiniteOptions } from "@/lib/orpc/builds-query";
import { orpc } from "@/lib/orpc/client";

import { BuildsTable } from "./BuildsTable";
import { NoBuildsSection } from "./NoBuildsSection";

type BuildsSectionProps = {
  projectId: string;
  search?: string;
};

export const BuildsSection = ({ projectId, search }: BuildsSectionProps) => {
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(
    orpc.builds.list.infiniteOptions(buildsListInfiniteOptions(projectId, search)),
  );

  const builds = data?.pages.flatMap((page) => page.builds) ?? [];

  if (!isPending && builds.length === 0 && !search) {
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
