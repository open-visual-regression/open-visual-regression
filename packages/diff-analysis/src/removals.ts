import type { RgbaImage } from "./image";
import { countIn, highlightChangesIn, type Highlights } from "./mask";
import { pixelWords } from "./pixels";
import { mergeNear, overlapsColumns, overlapsRows, unionRect } from "./rect";
import type { Rect, RectPair } from "./types";

// Removals this close together in the current image are one removal split up
// by the blank gaps between its words, which line up on their own.
const REMOVAL_GAP = 8;

// When less than this share of a removal's spot differs in place, the spot
// barely changed, so the alignment may have picked the wrong one of several
// look-alikes as the content that went.
const AMBIGUOUS_SHARE = 0.1;

type Removal = RectPair & { withinRow: boolean };

/**
 * Joins removals of the same kind that land at nearly the same spot in the
 * current image: content removed from the same rows, or rows removed from
 * the same columns. Each stays a zero-width line, for content removed from
 * within a row, or a zero-height one, for rows removed.
 */
const joinRemovals = (deletions: RectPair[]): Removal[] =>
  mergeNear(
    deletions.map((deletion) => ({ ...deletion, withinRow: deletion.current.width === 0 })),
    (removal) => removal.current,
    (first, second) => ({
      withinRow: first.withinRow,
      current: unionRect(first.current, second.current),
      baseline: unionRect(first.baseline, second.baseline),
    }),
    REMOVAL_GAP,
    (first, second) =>
      first.withinRow === second.withinRow &&
      (first.withinRow
        ? overlapsRows(first.current, second.current)
        : overlapsColumns(first.current, second.current)),
  ).map(({ withinRow, current, baseline }) => ({
    withinRow,
    current: withinRow ? { ...current, width: 0 } : { ...current, height: 0 },
    baseline,
  }));

/**
 * Removed content has no place in the current image, so where it was is
 * highlighted instead: each pixel where it differs from what's there now.
 * When that spot barely changed, like a segment gone from a bar of solid
 * segments where any of them could have been the one removed, everything
 * after it in the same row that differs in place is highlighted instead.
 * Returns where each removal is, as lines in the current image.
 */
export const highlightRemovals = (
  highlights: Highlights,
  baseline: RgbaImage,
  current: RgbaImage,
  deletions: RectPair[],
): Rect[] => {
  const { width, height, plain } = highlights;
  const baselineWords = pixelWords(baseline);
  const currentWords = pixelWords(current);
  const removals = joinRemovals(deletions);
  for (const { current: line, baseline: removed, withinRow } of removals) {
    const spot = { x: line.x, y: line.y, width: removed.width, height: removed.height };
    if (
      withinRow &&
      countIn(plain, width, height, spot) < spot.width * spot.height * AMBIGUOUS_SHARE
    ) {
      highlightChangesIn(highlights, { ...line, width: width - line.x });
      continue;
    }
    highlightChangesIn(
      highlights,
      spot,
      (pixel, dx, dy) =>
        baselineWords[(removed.y + dy) * baseline.width + removed.x + dx] !== currentWords[pixel],
    );
  }
  return removals.map(({ current: line }) => line);
};
