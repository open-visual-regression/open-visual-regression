import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import {
  type SnapshotFlag,
  type SnapshotHistoryCursor,
  type SnapshotsCursor,
} from "@ovr/api/contracts/snapshots";

import { type SnapshotFilters } from "@/lib/utils/snapshotFilters";

export const SNAPSHOTS_PAGE_SIZE = 60;

export const SNAPSHOT_HISTORY_PAGE_SIZE = 30;

type SnapshotsListInput = {
  buildId: string;
  search: string | undefined;
  statuses: SnapshotDisplayStatus[] | undefined;
  browsers: string[] | undefined;
  viewports: string[] | undefined;
  flags: SnapshotFlag[] | undefined;
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
  { search, statuses, browsers, viewports, flags }: SnapshotFilters,
): SnapshotsListInfiniteOptions => ({
  input: (cursor) => ({
    buildId,
    search,
    statuses,
    browsers,
    viewports,
    flags,
    limit: SNAPSHOTS_PAGE_SIZE,
    cursor,
  }),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});

type SnapshotHistoryInput = {
  snapshotId: string;
  limit: number;
  cursor: SnapshotHistoryCursor | undefined;
  align: "center";
};

type SnapshotHistoryPage = {
  nextCursor: SnapshotHistoryCursor | null;
  previousCursor: SnapshotHistoryCursor | null;
};

type SnapshotHistoryInfiniteOptions = {
  input: (cursor: SnapshotHistoryCursor | undefined) => SnapshotHistoryInput;
  initialPageParam: SnapshotHistoryCursor | undefined;
  getNextPageParam: (lastPage: SnapshotHistoryPage) => SnapshotHistoryCursor | undefined;
  getPreviousPageParam: (firstPage: SnapshotHistoryPage) => SnapshotHistoryCursor | undefined;
};

export const snapshotHistoryInfiniteOptions = (
  snapshotId: string,
): SnapshotHistoryInfiniteOptions => ({
  input: (cursor) => ({ snapshotId, limit: SNAPSHOT_HISTORY_PAGE_SIZE, cursor, align: "center" }),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  getPreviousPageParam: (firstPage) => firstPage.previousCursor ?? undefined,
});
