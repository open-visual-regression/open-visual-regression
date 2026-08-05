"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { type BuildSnapshotSchema, type SnapshotsCursor } from "@ovr/api/contracts/snapshots";

import { orpc } from "@/lib/orpc/client";
import { snapshotsListInfiniteOptions } from "@/lib/orpc/snapshots-query";

import { SnapshotGrid } from "./SnapshotGrid";

export type SnapshotsPage = {
  snapshots: BuildSnapshotSchema[];
  total: number;
  nextCursor: SnapshotsCursor | null;
};

type SnapshotsSectionProps = {
  projectId: string;
  buildId: string;
  /** The first page, rendered on the server and reused as the client's seed. */
  initialPage: SnapshotsPage;
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
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    ...orpc.snapshots.list.infiniteOptions(
      snapshotsListInfiniteOptions(buildId, search, { statuses, browsers, viewports }),
    ),
    // `initialData` rather than a HydrationBoundary on purpose: React Query only
    // applies it to an empty cache, so a re-render of this route (the live build
    // status triggers one) can't reset a reader who has scrolled to page one.
    // Changing a filter changes the query key, which correctly does start over.
    initialData: { pages: [initialPage], pageParams: [undefined] },
  });

  const snapshots = data.pages.flatMap((page) => page.snapshots);
  const total = data.pages[0]?.total;

  return (
    <SnapshotGrid
      snapshots={snapshots}
      projectId={projectId}
      buildId={buildId}
      search={search}
      total={total}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  );
};
