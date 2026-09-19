import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";

import { formatKeyValueRows } from "../../table";
import { formatStory, formatViewport } from "./table";

export type SnapshotDetailFields = {
  id: string;
  status: string;
  targetTitle: string;
  targetName: string;
  browser: string;
  viewportName: string;
  viewportWidth: number;
  viewportHeight: number | null;
  imagePath: string | null;
  hasUncaughtPageError: boolean;
  errorMessage: string | null;
  errorLogs: { id: string; level: string; message: string; timestamp: string }[];
};

const formatLog = (log: { level: string; message: string; timestamp: string }): string =>
  `  [${log.level}] ${log.message} (${log.timestamp})`;

export const formatSnapshotDetail = (snapshot: SnapshotDetailFields): string => {
  const rows: [string, string][] = [
    ["Snapshot", snapshot.id],
    ["Status", snapshot.status],
    ["Story", formatStory(snapshot)],
    ["Browser", snapshot.browser],
    ["Viewport", formatViewport(snapshot)],
    ["Image", snapshot.imagePath ?? ""],
  ];

  if (snapshot.hasUncaughtPageError) {
    rows.push(["Uncaught error", "yes"]);
  }

  if (snapshot.errorMessage) {
    rows.push(["Error", snapshot.errorMessage]);
  }

  const detail = formatKeyValueRows(rows);

  if (snapshot.errorLogs.length === 0) {
    return detail;
  }

  return `${detail}\n\nLogs:\n${snapshot.errorLogs.map(formatLog).join("\n")}`;
};

export const formatSnapshotOutput = (
  snapshot: SnapshotSchema,
  json: boolean | undefined,
): string => {
  if (json) {
    return JSON.stringify(snapshot, null, 2);
  }

  return formatSnapshotDetail(snapshot);
};
