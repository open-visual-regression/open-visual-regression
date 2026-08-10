"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";

import { orpc } from "@/lib/orpc/client";
import { snapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";

import { SnapshotGrid, SnapshotGridSkeleton } from "./SnapshotGrid";

type SnapshotsSectionProps = {
  projectId: string;
  buildId: string;
  search?: string;
  statuses?: SnapshotDisplayStatus[];
  browsers?: string[];
  viewports?: string[];
};

export const SnapshotsSection = ({
  projectId,
  buildId,
  search,
  statuses,
  browsers,
  viewports,
}: SnapshotsSectionProps) => {
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(
    orpc.snapshots.list.infiniteOptions(
      snapshotsListInfiniteOptions(buildId, search, { statuses, browsers, viewports }),
    ),
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
      search={search}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  );
};
