"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc/client";
import { snapshotHistoryInfiniteOptions } from "@/lib/orpc/snapshots-query";
import { useSnapshotPreferences } from "@/lib/providers/SnapshotPreferencesProvider";

import { SnapshotHistoryList, SnapshotHistoryListSkeleton } from "./SnapshotHistoryList";

type SnapshotSidebarHistoryContentProps = {
  projectId: string;
  snapshotId: string;
};

export const SnapshotSidebarHistoryContent = ({
  projectId,
  snapshotId,
}: SnapshotSidebarHistoryContentProps) => {
  const { sidebarOpen } = useSnapshotPreferences();
  const {
    data,
    isPending,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
  } = useInfiniteQuery({
    ...orpc.snapshots.getHistory.infiniteOptions(snapshotHistoryInfiniteOptions(snapshotId)),
    // The panel stays mounted while the sidebar is collapsed; only fetch once it is open.
    enabled: sidebarOpen,
  });

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
          hasPreviousPage={hasPreviousPage}
          isFetchingNextPage={isFetchingNextPage}
          isFetchingPreviousPage={isFetchingPreviousPage}
          onLoadMore={fetchNextPage}
          onLoadPrevious={fetchPreviousPage}
        />
      )}
    </div>
  );
};
