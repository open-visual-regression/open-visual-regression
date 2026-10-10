import type { SnapshotFlagDetail, SnapshotSchema } from "@ovr/api/contracts/snapshots";

import { formatKeyValueRows } from "../../table";
import { formatFlagDetail, formatFlags, getSnapshotFlags } from "./flags";
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
  isFlaky: boolean;
  hasUncaughtPageError: boolean;
  flags?: SnapshotFlagDetail[];
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

  const flags = getSnapshotFlags(snapshot);

  if (flags.length > 0) {
    rows.push(["Flags", formatFlags(flags)]);
  }

  if (snapshot.errorMessage) {
    rows.push(["Error", snapshot.errorMessage]);
  }

  const sections = [formatKeyValueRows(rows)];

  if (snapshot.flags && snapshot.flags.length > 0) {
    sections.push(
      `Flags:\n${snapshot.flags.map((flag) => `  ${formatFlagDetail(flag)}`).join("\n")}`,
    );
  }

  if (snapshot.errorLogs.length > 0) {
    sections.push(`Logs:\n${snapshot.errorLogs.map(formatLog).join("\n")}`);
  }

  return sections.join("\n\n");
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
