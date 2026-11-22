import type { Alignment } from "./align";
import type { RgbaImage } from "./image";
import { hasMarks, highlightChangesIn, type Highlights } from "./mask";
import { pixelWords } from "./pixels";
import { mergeNear, overlapsColumns, unionRect } from "./rect";
import type { Rect } from "./types";

// Spacing changes in bands narrower than this are slivers between letters that
// happened to line up, not layout.
const MIN_SPACING_WIDTH = 32;

// A block of content taller than this right after a spacing change isn't one
// element that moved, like when card backgrounds run on with no blank row
// between them, so it isn't highlighted.
const MAX_MOVED_BLOCK_HEIGHT = 400;

// Slivers of one spacing change, split between letters, lie this close together.
const SLIVER_GAP = 8;

/**
 * Where only blank space changed: a zero-height line in the current image at
 * the top of the content below it, and what a blank row there looks like,
 * one pixel per column of the line.
 */
type SpaceChange = { line: Rect; blankRow: Uint32Array };

/** One row of an image across the given columns, as 32-bit pixels. */
const rowOf = (image: RgbaImage, y: number, x: number, width: number): Uint32Array =>
  pixelWords(image).slice(y * image.width + x, y * image.width + x + width);

/** Whether every row of a rect is the same, as in blank space that grew. */
const rowsAreAlike = (image: RgbaImage, { x, y, width, height }: Rect): boolean => {
  const words = pixelWords(image);
  for (let row = y + 1; row < y + height; row++) {
    for (let column = x; column < x + width; column++) {
      if (words[row * image.width + column] !== words[y * image.width + column]) {
        return false;
      }
    }
  }
  return true;
};

/** Joins the slivers of one spacing change, keeping each one's blank row. */
const joinSlivers = (changes: SpaceChange[], current: RgbaImage): SpaceChange[] =>
  mergeNear(
    changes,
    (change) => change.line,
    (first, second) => {
      const line = { ...unionRect(first.line, second.line), height: 0 };
      // Columns between slivers take the current image's row just above the change.
      const blankRow = rowOf(current, Math.max(line.y - 1, 0), line.x, line.width);
      for (const { line: part, blankRow: partRow } of [first, second]) {
        blankRow.set(partRow, part.x - line.x);
      }
      return { line, blankRow };
    },
    SLIVER_GAP,
  );

/**
 * The rows, from `line` down, of the first block of content within its
 * columns: from the first row that isn't blank to the next one that is.
 * Comparing with what a blank row looks like there, rather than with one
 * background color, keeps the borders of a surrounding card blank.
 */
const firstContentRows = (image: RgbaImage, { line, blankRow }: SpaceChange): Rect => {
  const words = pixelWords(image);
  const rowIsBlank = (row: number) => {
    for (let offset = 0; offset < line.width; offset++) {
      if (words[row * image.width + line.x + offset] !== blankRow[offset]) {
        return false;
      }
    }
    return true;
  };
  let start = line.y;
  while (start < image.height && rowIsBlank(start)) {
    start++;
  }
  let stop = start;
  while (stop < image.height && !rowIsBlank(stop)) {
    stop++;
  }
  return { ...line, y: start, height: stop - start };
};

/**
 * Where only blank space was added or removed above some content, like a
 * margin that changed, that content moved because of it, so the first block
 * of it is highlighted as the change, wherever it differs in place.
 *
 * Only something that changes height pushes content down, so a spacing change
 * is left out when new content was inserted or content removed further up in
 * the same columns, or an earlier spacing change there was already
 * highlighted: that explains the shift. Something that changed in place, like
 * a color, doesn't.
 */
export const highlightSpacingChanges = (
  highlights: Highlights,
  baseline: RgbaImage,
  current: RgbaImage,
  { insertions, removedSpace }: Pick<Alignment, "insertions" | "removedSpace">,
  removals: Rect[],
): void => {
  const { width, height, mask, plain } = highlights;
  const isAddedSpace = ({ rect, axis, nested }: Alignment["insertions"][number]) =>
    axis === "rows" &&
    !nested &&
    !hasMarks(mask, width, height, rect) &&
    rowsAreAlike(current, rect);

  const spaceChanges = joinSlivers(
    [
      ...insertions.filter(isAddedSpace).map(({ rect }) => ({
        line: { ...rect, y: rect.y + rect.height, height: 0 },
        blankRow: rowOf(current, rect.y, rect.x, rect.width),
      })),
      ...removedSpace
        .filter(({ nested }) => !nested)
        .map(({ current: line, baseline: removed }) => ({
          line,
          blankRow: rowOf(baseline, removed.y, removed.x, removed.width),
        })),
    ],
    current,
  )
    .filter(({ line }) => line.width >= MIN_SPACING_WIDTH)
    .sort((first, second) => first.line.y - second.line.y);

  const heightChanges = [
    ...insertions.filter(({ rect }) => hasMarks(mask, width, height, rect)).map(({ rect }) => rect),
    ...removals,
  ];
  for (const change of spaceChanges) {
    const { line } = change;
    if (heightChanges.some((above) => overlapsColumns(above, line) && above.y <= line.y)) {
      continue;
    }
    const block = firstContentRows(current, change);
    if (block.height <= MAX_MOVED_BLOCK_HEIGHT && hasMarks(plain, width, height, block)) {
      highlightChangesIn(highlights, block);
      heightChanges.push(line);
    }
  }
};
