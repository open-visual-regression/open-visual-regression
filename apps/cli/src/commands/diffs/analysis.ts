import { analyzeDiff, decodePng, type DiffAnalysis } from "@ovr/diff-analysis/analyzeDiff";

import type { OvrClient } from "../../client";
import { fetchImage } from "../../download";

type StorageClient = {
  storage: Pick<OvrClient["storage"], "getObject">;
};

export const analyzeImages = async (
  client: StorageClient,
  baselineImagePath: string | null,
  imagePath: string | null,
): Promise<DiffAnalysis> => {
  if (!baselineImagePath || !imagePath) {
    throw new Error("This snapshot has no baseline to analyze against.");
  }

  const [baseline, current] = await Promise.all([
    fetchImage(client, baselineImagePath),
    fetchImage(client, imagePath),
  ]);

  return analyzeDiff(decodePng(baseline), decodePng(current));
};

const formatDistance = (pixels: number, negative: string, positive: string): string | null =>
  pixels === 0 ? null : `${Math.abs(pixels)}px ${pixels < 0 ? negative : positive}`;

export const formatDiffAnalysis = ({
  changedPixelCount,
  changedRegion,
  shift,
  sizeChange,
}: DiffAnalysis): string => {
  const lines: string[] = [];

  if (sizeChange) {
    const { from, to } = sizeChange;
    lines.push(`Size changed from ${from.width}x${from.height} to ${to.width}x${to.height}`);
  }

  if (!changedRegion) {
    lines.push("No pixels changed");
  } else {
    lines.push(
      `${changedPixelCount} pixels changed within ${changedRegion.width}x${changedRegion.height} at ${changedRegion.x},${changedRegion.y}`,
    );
  }

  if (shift) {
    const distances = [
      formatDistance(shift.x, "left", "right"),
      formatDistance(shift.y, "up", "down"),
    ].filter((distance) => distance !== null);
    lines.push(
      `Content moved ${distances.join(" and ")} (explains ${shift.explainedPercent}% of the change)`,
    );
  } else if (changedRegion) {
    lines.push("The change isn't explained by content moving");
  }

  return `Analysis:\n${lines.map((line) => `  ${line}`).join("\n")}`;
};
