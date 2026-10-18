"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc/client";
import { snapshotHistoryInfiniteOptions } from "@/lib/orpc/snapshots-query";

import { SnapshotHistoryList, SnapshotHistoryListSkeleton } from "./SnapshotHistoryList";

type SnapshotSidebarHistoryContentProps = {
  projectId: string;
  snapshotId: string;
};

export const SnapshotSidebarHistoryContent = ({
  projectId,
  snapshotId,
}: SnapshotSidebarHistoryContentProps) => {
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(
    orpc.snapshots.getHistory.infiniteOptions(snapshotHistoryInfiniteOptions(snapshotId)),
  );

  return (
    <div className="px-3 pb-3">
      {isPending ? (
        <SnapshotHistoryListSkeleton />
      ) : (
        <SnapshotHistoryList
          entries={data?.pages.flatMap((page) => page.snapshots) ?? []}
          branch={data?.pages[0]?.branch ?? ""}
          projectId={projectId}
          snapshotId={snapshotId}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      )}
    </div>
  );
};
