"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { type SnapshotFlag } from "@ovr/api/contracts/snapshots";

import { SnapshotGrid, SnapshotGridSkeleton } from "@/lib/components/snapshot-grid/SnapshotGrid";
import { orpc } from "@/lib/orpc/client";
import { baselineSnapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";

import { BaselineSnapshotCard } from "./BaselineSnapshotCard";

type BaselineSnapshotsSectionProps = {
  projectIds?: string[];
  flags?: SnapshotFlag[];
};

export const BaselineSnapshotsSection = ({ projectIds, flags }: BaselineSnapshotsSectionProps) => {
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(
    orpc.snapshots.listBaselines.infiniteOptions(
      baselineSnapshotsListInfiniteOptions({ projectIds, flags }),
    ),
  );

  if (isPending) {
    return <SnapshotGridSkeleton />;
  }

  const snapshots = data?.pages.flatMap((page) => page.snapshots) ?? [];

  return (
    <SnapshotGrid
      items={snapshots}
      getKey={(snapshot) => snapshot.id}
      renderItem={(snapshot) => <BaselineSnapshotCard snapshot={snapshot} />}
      emptyMessage="no snapshots found"
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  );
};
