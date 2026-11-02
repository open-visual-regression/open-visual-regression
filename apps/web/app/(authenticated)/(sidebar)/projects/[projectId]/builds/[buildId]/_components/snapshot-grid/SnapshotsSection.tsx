"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { SnapshotGrid, SnapshotGridSkeleton } from "@/lib/components/snapshot-grid/SnapshotGrid";
import { orpc } from "@/lib/orpc/client";
import { snapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";
import { type SnapshotFilters } from "@/lib/utils/snapshotFilters";

import { SnapshotCard } from "./SnapshotCard";

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
      items={snapshots}
      getKey={(snapshot) => snapshot.id}
      renderItem={(snapshot) => (
        <SnapshotCard
          snapshot={snapshot}
          projectId={projectId}
          buildId={buildId}
          filters={filters}
        />
      )}
      emptyMessage={
        filters.search ? `no snapshots found matching "${filters.search}"` : "no snapshots found"
      }
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  );
};
