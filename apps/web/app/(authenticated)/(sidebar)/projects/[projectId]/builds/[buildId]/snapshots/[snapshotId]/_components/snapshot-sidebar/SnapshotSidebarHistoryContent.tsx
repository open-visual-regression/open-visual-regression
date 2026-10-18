"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@ovr/ui/components/button";

import { orpc } from "@/lib/orpc/client";
import { snapshotHistoryInfiniteOptions } from "@/lib/orpc/snapshots-query";
import { useScrollContainer } from "@/lib/providers/ScrollContainer";

import { SnapshotHistoryList, SnapshotHistoryListSkeleton } from "./SnapshotHistoryList";

type SnapshotSidebarHistoryContentProps = {
  projectId: string;
  snapshotId: string;
};

export const SnapshotSidebarHistoryContent = ({
  projectId,
  snapshotId,
}: SnapshotSidebarHistoryContentProps) => {
  const scrollElement = useScrollContainer();
  const [startAt, setStartAt] = useState<"snapshot" | "latest">("snapshot");
  const {
    data,
    isPending,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
  } = useInfiniteQuery(
    orpc.snapshots.getHistory.infiniteOptions(snapshotHistoryInfiniteOptions(snapshotId, startAt)),
  );

  const jumpToLatest = () => {
    setStartAt("latest");
    scrollElement?.scrollTo({ top: 0 });
  };

  return (
    <div className="px-3 pb-3">
      {hasPreviousPage ? (
        <div className="sticky top-0 z-10 flex justify-center bg-background pb-3">
          <Button variant="outline" color="neutral" size="sm" onClick={jumpToLatest}>
            jump to latest
          </Button>
        </div>
      ) : null}
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
