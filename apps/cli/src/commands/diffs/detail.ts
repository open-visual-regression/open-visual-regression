import type { DiffSchema } from "@ovr/api/contracts/diffs";

import { formatKeyValueRows } from "../../table";
import { formatDiffPercent } from "../snapshots/table";

const NO_DIFF_MESSAGE = "No diff for this snapshot.";

const formatPixelDiffCount = (pixelDiffCount: number | null): string =>
  pixelDiffCount === null ? "-" : String(pixelDiffCount);

export const formatDiffDetail = (diff: DiffSchema): string => {
  const rows: [string, string][] = [
    ["Diff", diff.id],
    ["Review", diff.reviewStatus],
    ["Processing", diff.processingStatus],
    ["Pixel diff", formatPixelDiffCount(diff.pixelDiffCount)],
    ["Diff %", formatDiffPercent(diff.diffPercent)],
    ["Diff image", diff.diffImagePath ?? ""],
  ];

  if (diff.baselineSnapshot) {
    rows.push(["Baseline image", diff.baselineSnapshot.imagePath ?? ""]);

    if (diff.baselineSnapshot.commitSha) {
      rows.push(["Baseline commit", diff.baselineSnapshot.commitSha]);
    }

    if (diff.baselineSnapshot.commitUrl) {
      rows.push(["Baseline commit URL", diff.baselineSnapshot.commitUrl]);
    }
  }

  return formatKeyValueRows(rows);
};

export const formatDiffOutput = (diff: DiffSchema | null, json: boolean | undefined): string => {
  if (json) {
    return JSON.stringify(diff, null, 2);
  }

  return diff ? formatDiffDetail(diff) : NO_DIFF_MESSAGE;
};
