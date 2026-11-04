"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc/client";
import { type SnapshotsListScope, snapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";
import { type SnapshotFilters } from "@/lib/utils/snapshotFilters";

import { SnapshotCard, SnapshotCardSkeleton } from "./SnapshotCard";
import { SnapshotGrid, SnapshotGridSkeleton } from "./SnapshotGrid";

type SnapshotsSectionProps = SnapshotsListScope & {
  filters?: SnapshotFilters;
  showProject?: boolean;
};

export const SnapshotsSection = ({
  buildId,
  sort,
  filters,
  showProject = false,
}: SnapshotsSectionProps) => {
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(
    orpc.snapshots.list.infiniteOptions(snapshotsListInfiniteOptions({ buildId, sort }, filters)),
  );

  const skeleton = <SnapshotCardSkeleton showProject={showProject} />;

  if (isPending) {
    return <SnapshotGridSkeleton skeleton={skeleton} />;
  }

  const snapshots = data?.pages.flatMap((page) => page.snapshots) ?? [];

  return (
    <SnapshotGrid
      items={snapshots}
      getKey={(snapshot) => snapshot.id}
      renderItem={(snapshot) => (
        <SnapshotCard
          snapshot={snapshot}
          filters={buildId ? filters : undefined}
          showProject={showProject}
        />
      )}
      skeleton={skeleton}
      emptyMessage={
        filters?.search ? `no snapshots found matching "${filters.search}"` : "no snapshots found"
      }
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  );
};
