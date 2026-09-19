import type { BuildSnapshotSchema } from "@ovr/api/contracts/snapshots";

import {
  formatAppliedFilters,
  formatNextPageHint,
  formatTable,
  type AppliedFilters,
} from "../../table";

export type SnapshotsTableRow = {
  id: string;
  status: string;
  story: string;
  browser: string;
  viewport: string;
  diffPercent: string;
};

const HEADERS = ["SNAPSHOT", "STATUS", "STORY", "BROWSER", "VIEWPORT", "DIFF%"];

const DIFF_PERCENT_PRECISION = 2;

export const formatStory = (snapshot: { targetTitle: string; targetName: string }): string =>
  `${snapshot.targetTitle} / ${snapshot.targetName}`;

/** A snapshot with no fixed height was captured at the story's full page height. */
export const formatViewport = (snapshot: {
  viewportName: string;
  viewportWidth: number;
  viewportHeight: number | null;
}): string =>
  `${snapshot.viewportName} ${snapshot.viewportWidth}x${snapshot.viewportHeight ?? "full"}`;

export const formatDiffPercent = (diffPercent: number | null): string =>
  diffPercent === null ? "-" : diffPercent.toFixed(DIFF_PERCENT_PRECISION);

export const formatSnapshotsTable = (rows: SnapshotsTableRow[]): string =>
  formatTable(
    HEADERS,
    rows.map((row) => [row.id, row.status, row.story, row.browser, row.viewport, row.diffPercent]),
  );

export type SnapshotsOutput = {
  snapshots: BuildSnapshotSchema[];
  total: number;
  nextCursor: string | null;
  filters?: AppliedFilters;
};

export const formatSnapshotsOutput = (
  { snapshots, total, nextCursor, filters }: SnapshotsOutput,
  json: boolean | undefined,
): string => {
  if (json) {
    return JSON.stringify({ snapshots, total, nextCursor }, null, 2);
  }

  if (snapshots.length === 0) {
    return ["No snapshots found.", formatAppliedFilters(filters)].filter(Boolean).join("\n");
  }

  const table = formatSnapshotsTable(
    snapshots.map((snapshot) => ({
      id: snapshot.id,
      status: snapshot.status,
      story: formatStory(snapshot),
      browser: snapshot.browser,
      viewport: formatViewport(snapshot),
      diffPercent: formatDiffPercent(snapshot.diffPercent),
    })),
  );

  if (!nextCursor) {
    return table;
  }

  return `${table}\n\n${formatNextPageHint(snapshots.length, total, nextCursor)}`;
};
