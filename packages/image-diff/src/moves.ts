import { pixelWords } from "./pixels";
import type { Image, Rect, Region } from "./types";

// Content that moved may land a pixel or two off from where its box was measured.
const SLACK = 2;
// Share of pixels that must be identical for two boxes to hold the same content.
const MIN_SAME = 0.97;
// Smaller boxes, like a single letter or a thin line of a dotted background,
// look the same as plenty of other boxes, so they're never called a move.
const MIN_SIDE = 8;
const MIN_AREA = 256;
// Larger boxes are left alone: comparing them at every offset gets slow, and
// whole sections that moved are already lined up by the alignment.
const MAX_AREA = 160_000;

/** Whether two same-size boxes hold the same pixels, allowing a small offset. */
const sameContent = (current: Image, from: Rect, baseline: Image, to: Rect): boolean => {
  const currentWords = pixelWords(current);
  const baselineWords = pixelWords(baseline);
  const width = Math.min(from.width, to.width);
  const height = Math.min(from.height, to.height);
  const needed = width * height * MIN_SAME;
  for (let dy = -SLACK; dy <= SLACK; dy++) {
    for (let dx = -SLACK; dx <= SLACK; dx++) {
      const x0 = to.x + dx;
      const y0 = to.y + dy;
      if (x0 < 0 || y0 < 0 || x0 + width > baseline.width || y0 + height > baseline.height) {
        continue;
      }
      let same = 0;
      for (let row = 0; row < height; row++) {
        const fromStart = (from.y + row) * current.width + from.x;
        const toStart = (y0 + row) * baseline.width + x0;
        for (let column = 0; column < width; column++) {
          same += currentWords[fromStart + column] === baselineWords[toStart + column] ? 1 : 0;
        }
      }
      if (same >= needed) {
        return true;
      }
    }
  }
  return false;
};

const similarSize = (a: Rect, b: Rect) =>
  Math.abs(a.width - b.width) <= SLACK * 2 && Math.abs(a.height - b.height) <= SLACK * 2;

/**
 * Pairs content that appeared in one place with identical content that
 * disappeared from another, like two buttons that swapped places, and reports
 * each pair as one move instead of an insertion and a deletion.
 */
export const pairMoves = (
  baseline: Image,
  current: Image,
  insertions: Array<{ region: Region; content: Rect }>,
  deletions: Region[],
): { moved: Region[]; inserted: Region[]; deleted: Region[] } => {
  const used = new Set<Region>();
  const moved: Region[] = [];
  const inserted: Region[] = [];
  for (const { region, content } of insertions) {
    const area = content.width * content.height;
    const candidate =
      content.width >= MIN_SIDE &&
      content.height >= MIN_SIDE &&
      area >= MIN_AREA &&
      area <= MAX_AREA;
    const match = candidate
      ? deletions.find(
          (deletion) =>
            !used.has(deletion) &&
            similarSize(content, deletion.baseline) &&
            sameContent(current, content, baseline, deletion.baseline),
        )
      : undefined;
    if (match) {
      used.add(match);
      moved.push({ kind: "moved", current: content, baseline: match.baseline });
    } else {
      inserted.push(region);
    }
  }
  return { moved, inserted, deleted: deletions.filter((deletion) => !used.has(deletion)) };
};
