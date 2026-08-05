import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { type SnapshotsCursor } from "@ovr/api/contracts/snapshots";

// Fills whole rows at 2, 3 and 4 columns, and covers roughly two viewports of
// cards at the widest breakpoint — enough that the first page rarely runs out
// before the reader starts scrolling.
export const SNAPSHOTS_PAGE_SIZE = 36;

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

/**
 * Shared by the server render and the client hook so both agree on the query
 * key — and so the first page the server fetches is the same page the client
 * would have fetched itself.
 */
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
