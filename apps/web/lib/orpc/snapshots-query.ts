import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { type SnapshotsCursor } from "@ovr/api/contracts/snapshots";

import { type SnapshotFilters } from "@/lib/utils/snapshotFilters";

export const SNAPSHOTS_PAGE_SIZE = 60;

type SnapshotsListInput = {
  buildId: string;
  search: string | undefined;
  statuses: SnapshotDisplayStatus[] | undefined;
  browsers: string[] | undefined;
  viewports: string[] | undefined;
  limit: number;
  cursor: SnapshotsCursor | undefined;
};

type SnapshotsListInfiniteOptions = {
  input: (cursor: SnapshotsCursor | undefined) => SnapshotsListInput;
  initialPageParam: SnapshotsCursor | undefined;
  getNextPageParam: (lastPage: {
    nextCursor: SnapshotsCursor | null;
  }) => SnapshotsCursor | undefined;
};

export const snapshotsListInfiniteOptions = (
  buildId: string,
  { search, statuses, browsers, viewports }: SnapshotFilters,
): SnapshotsListInfiniteOptions => ({
  input: (cursor) => ({
    buildId,
    search,
    statuses,
    browsers,
    viewports,
    limit: SNAPSHOTS_PAGE_SIZE,
    cursor,
  }),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});
