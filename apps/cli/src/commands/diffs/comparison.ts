import type { ImageDiff } from "@ovr/image-diff/diffImages";

import { formatKeyValueRows } from "../../table";
import { formatDiffPercent } from "../snapshots/table";

export type LocalComparison = ImageDiff & {
  threshold: number;
  diffImagePath: string | null;
};

export const isUnchanged = (diffPercent: number, threshold: number): boolean =>
  diffPercent === 0 || diffPercent <= threshold;

export const formatComparisonOutput = (
  comparison: LocalComparison,
  json: boolean | undefined,
): string => {
  const unchanged = isUnchanged(comparison.diffPercent, comparison.threshold);

  if (json) {
    return JSON.stringify(
      {
        width: comparison.width,
        height: comparison.height,
        pixelDiffCount: comparison.pixelDiffCount,
        diffPercent: comparison.diffPercent,
        threshold: comparison.threshold,
        unchanged,
        diffImagePath: comparison.diffImagePath,
      },
      null,
      2,
    );
  }

  const rows: [string, string][] = [
    ["Compared", `${comparison.width}x${comparison.height}`],
    ["Pixel diff", String(comparison.pixelDiffCount)],
    ["Diff %", formatDiffPercent(comparison.diffPercent)],
    ["Threshold", String(comparison.threshold)],
    ["Result", unchanged ? "unchanged" : "needs review"],
  ];

  if (comparison.diffImagePath) {
    rows.push(["Diff image", comparison.diffImagePath]);
  }

  return formatKeyValueRows(rows);
};
