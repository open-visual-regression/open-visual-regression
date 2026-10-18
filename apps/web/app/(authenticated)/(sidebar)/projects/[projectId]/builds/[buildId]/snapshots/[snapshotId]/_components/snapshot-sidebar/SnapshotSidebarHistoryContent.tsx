"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
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
    orpc.snapshots.getHistory.infiniteOptions(snapshotHistoryInfiniteOptions(snapshotId)),
  );

  const latest = data?.pages[0]?.latest;

  return (
    <div className="px-3 pb-3">
      {hasPreviousPage && latest ? (
        <div className="sticky top-0 z-10 flex justify-center bg-background pb-3">
          <ButtonLink
            href={`/projects/${projectId}/builds/${latest.buildId}/snapshots/${latest.id}`}
            variant="outline"
            color="neutral"
            size="sm"
          >
            jump to latest
          </ButtonLink>
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
