import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { type SnapshotsCursor } from "@ovr/api/contracts/snapshots";

export const SNAPSHOTS_PAGE_SIZE = 60;

export type SnapshotsListFilters = {
  statuses?: SnapshotDisplayStatus[];
  browsers?: string[];
  viewports?: string[];
};

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
  search?: string,
  filters: SnapshotsListFilters = {},
): SnapshotsListInfiniteOptions => ({
  input: (cursor) => ({
    buildId,
    search,
    statuses: filters.statuses,
    browsers: filters.browsers,
    viewports: filters.viewports,
    limit: SNAPSHOTS_PAGE_SIZE,
    cursor,
  }),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});
