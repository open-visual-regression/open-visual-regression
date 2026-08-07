"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { type ListOutputSchema } from "@ovr/api/contracts/snapshots";

import { orpc } from "@/lib/orpc/client";
import { snapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";

import { SnapshotGrid } from "./SnapshotGrid";

type SnapshotsSectionProps = {
  projectId: string;
  buildId: string;
  initialPage: ListOutputSchema;
  search?: string;
  statuses?: SnapshotDisplayStatus[];
  browsers?: string[];
  viewports?: string[];
};

export const SnapshotsSection = ({
  projectId,
  buildId,
  initialPage,
  search,
  statuses,
  browsers,
  viewports,
}: SnapshotsSectionProps) => {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(
    orpc.snapshots.list.infiniteOptions({
      ...snapshotsListInfiniteOptions(buildId, search, { statuses, browsers, viewports }),
      initialData: { pages: [initialPage], pageParams: [undefined] },
    }),
  );

  const snapshots = data.pages.flatMap((page) => page.snapshots);

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
