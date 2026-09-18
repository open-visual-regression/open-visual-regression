"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc/client";
import { snapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";
import { type SnapshotFilters } from "@/lib/utils/snapshotFilters";

import { SnapshotGrid, SnapshotGridSkeleton } from "./SnapshotGrid";

type SnapshotsSectionProps = {
  projectId: string;
  buildId: string;
  filters: SnapshotFilters;
};

export const SnapshotsSection = ({ projectId, buildId, filters }: SnapshotsSectionProps) => {
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(
    orpc.snapshots.list.infiniteOptions(snapshotsListInfiniteOptions(buildId, filters)),
  );

  if (isPending) {
    return <SnapshotGridSkeleton />;
  }

  const snapshots = data?.pages.flatMap((page) => page.snapshots) ?? [];

  return (
    <SnapshotGrid
      snapshots={snapshots}
      projectId={projectId}
      buildId={buildId}
      filters={filters}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  );
};
