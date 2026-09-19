import { snapshotDisplayStatusSchema } from "@ovr/api/contracts/builds";
import type { SnapshotCountsSchema } from "@ovr/api/contracts/snapshots";

import { formatTable } from "../../table";

const HEADERS = ["STATUS", "COUNT"];

const TOTAL_LABEL = "TOTAL";

export const formatSnapshotCounts = (counts: SnapshotCountsSchema): string => {
  const present = snapshotDisplayStatusSchema.options.filter((status) => counts[status] > 0);

  if (present.length === 0) {
    return "No snapshots found.";
  }

  const total = present.reduce((sum, status) => sum + counts[status], 0);

  return formatTable(HEADERS, [
    ...present.map((status) => [status, String(counts[status])]),
    [TOTAL_LABEL, String(total)],
  ]);
};

export const formatSnapshotCountsOutput = (
  counts: SnapshotCountsSchema,
  json: boolean | undefined,
): string => (json ? JSON.stringify(counts, null, 2) : formatSnapshotCounts(counts));
