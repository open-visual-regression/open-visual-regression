import { alignLines, type LineAlignment, type LineSpan } from "./alignLines";
import type { RgbaImage } from "./image";
import { hashLines, pixelWords, solidColumnColor } from "./pixels";
import { lineCount, otherAxis, sliceRect } from "./rect";
import type { Axis, Rect, RectPair } from "./types";

/**
 * The baseline rearranged into the current image's coordinates, so the two can
 * be compared pixel by pixel. Rows and columns that only moved are copied to
 * where they ended up; content with no counterpart is recorded as inserted or
 * deleted.
 */
export type Alignment = {
  /** Baseline pixels placed where they sit in the current image (RGBA, current size). */
  aligned: Uint8Array;
  /**
   * Where each row of the current image came from, as stretches copied from
   * the baseline in the order they were placed, so a later one wins. Read it
   * with `baselinePixelOf`.
   */
  sources: RowSources;
  /**
   * Rects of the current image the baseline has no counterpart for, the axis
   * they run along, and whether they were found inside a band that changed
   * rather than across a whole band.
   */
  insertions: { rect: Rect; axis: Axis; nested: boolean }[];
  /** Baseline content with no place in the current image, as zero-width or zero-height lines. */
  deletions: RectPair[];
  /**
   * Where only blank space was removed: a zero-width or zero-height line in
   * the current image, the blank baseline rect that was removed, and whether
   * it was found inside a band that changed rather than across a whole band.
   */
  removedSpace: (RectPair & { nested: boolean })[];
  /** Whether anything moved. When nothing did, `aligned` is the baseline as it was. */
  shifted: boolean;
};

// Rows, then columns inside rows that changed, then rows inside those columns,
// and so on. Each level only looks at what the one before couldn't line up.
const MAX_DEPTH = 4;

type Context = {
  baseline: RgbaImage;
  current: RgbaImage;
  baselineWords: Uint32Array;
  currentWords: Uint32Array;
  alignedWords: Uint32Array;
  sources: RowSources;
  insertions: Alignment["insertions"];
  deletions: Alignment["deletions"];
  removedSpace: Alignment["removedSpace"];
  shifted: boolean;
};

/**
 * For each row of the current image, flat triples of the stretches placed in
 * it: the column the stretch starts at, its width, and the index of the
 * baseline pixel its first pixel came from, or -1 for a stretch filled in for
 * content the baseline doesn't have.
 */
export type RowSources = number[][];

/** Records where a stretch of each row of a current rect came from. */
const recordSources = (context: Context, current: Rect, baselineStart: (row: number) => number) => {
  for (let row = 0; row < current.height; row++) {
    context.sources[current.y + row]?.push(current.x, current.width, baselineStart(row));
  }
};

/**
 * The index of the baseline pixel placed at a pixel of the current image, or
 * -1 where the current image has content the baseline doesn't.
 */
export const baselinePixelOf = ({ sources }: Alignment, x: number, y: number): number => {
  const row = sources[y] ?? [];
  for (let stretch = row.length - 3; stretch >= 0; stretch -= 3) {
    const start = row[stretch] ?? 0;
    const from = row[stretch + 2] ?? -1;
    if (x >= start && x < start + (row[stretch + 1] ?? 0)) {
      return from < 0 ? -1 : from + x - start;
    }
  }
  return -1;
};

/** Copies a baseline rect into the same-size current rect of the aligned image. */
const copyRect = (context: Context, pair: RectPair) => {
  const { baselineWords, alignedWords, baseline, current } = context;
  if (pair.baseline.x !== pair.current.x || pair.baseline.y !== pair.current.y) {
    context.shifted = true;
  }
  recordSources(
    context,
    pair.current,
    (row) => (pair.baseline.y + row) * baseline.width + pair.baseline.x,
  );
  if (pair.current.width === current.width && pair.baseline.width === baseline.width) {
    const from = pair.baseline.y * baseline.width;
    alignedWords.set(
      baselineWords.subarray(from, from + pair.current.height * current.width),
      pair.current.y * current.width,
    );
    return;
  }
  for (let row = 0; row < pair.current.height; row++) {
    const from = (pair.baseline.y + row) * baseline.width + pair.baseline.x;
    alignedWords.set(
      baselineWords.subarray(from, from + pair.current.width),
      (pair.current.y + row) * current.width + pair.current.x,
    );
  }
};

type Neighbors = { before: Rect | null; after: Rect | null };

const equalPixels = (context: Context, baseline: Rect, current: Rect) => {
  const { baselineWords, currentWords, baseline: image } = context;
  let equal = 0;
  for (let row = 0; row < current.height; row++) {
    for (let column = 0; column < current.width; column++) {
      equal +=
        baselineWords[(baseline.y + row) * image.width + baseline.x + column] ===
        currentWords[(current.y + row) * context.current.width + current.x + column]
          ? 1
          : 0;
    }
  }
  return equal;
};

/**
 * Fills a current rect that has no baseline counterpart with a baseline line
 * next to where it was inserted, repeated. Lines that match the line after the
 * gap take it, the rest take the line before, so blank space that only grew
 * compares equal while new content still stands out.
 */
const fillInserted = (
  context: Context,
  rect: Rect,
  axis: Axis,
  { before, after }: Neighbors,
  nested: boolean,
) => {
  for (let line = 0; line < lineCount(rect, axis); line++) {
    const target = sliceRect(rect, axis, line, 1);
    const neighbor =
      after && (!before || equalPixels(context, after, target) === target.width * target.height)
        ? after
        : before;
    if (neighbor) {
      copyRect(context, { baseline: neighbor, current: target });
    }
  }
  // The copies only stand in for what's there; none of it came from the baseline.
  recordSources(context, rect, () => -1);
  context.insertions.push({ rect, axis, nested });
};

/**
 * The part of a deleted baseline rect that differs from the lines on both
 * sides of it, or null when the deletion was only blank space.
 */
const deletedContent = (
  context: Context,
  rect: Rect,
  axis: Axis,
  { before, after }: Neighbors,
): Rect | null => {
  const { baselineWords, baseline } = context;
  const referenceIndex = (line: Rect | null, row: number, column: number) => {
    if (line === null) {
      return -1;
    }
    return axis === "rows"
      ? line.y * baseline.width + rect.x + column
      : (rect.y + row) * baseline.width + line.x;
  };
  let left = Infinity;
  let top = Infinity;
  let right = -1;
  let bottom = -1;
  for (let row = 0; row < rect.height; row++) {
    for (let column = 0; column < rect.width; column++) {
      const pixel = baselineWords[(rect.y + row) * baseline.width + rect.x + column];
      const beforeIndex = referenceIndex(before, row, column);
      const afterIndex = referenceIndex(after, row, column);
      const blank =
        (beforeIndex >= 0 && pixel === baselineWords[beforeIndex]) ||
        (afterIndex >= 0 && pixel === baselineWords[afterIndex]);
      if (!blank) {
        left = Math.min(left, column);
        top = Math.min(top, row);
        right = Math.max(right, column);
        bottom = Math.max(bottom, row);
      }
    }
  }
  return right < 0
    ? null
    : {
        x: rect.x + left,
        y: rect.y + top,
        width: right - left + 1,
        height: bottom - top + 1,
      };
};

/**
 * The baseline lines just before and just after lines [start, end) of a rect,
 * looking past the rect's edges as long as they're inside the image.
 */
const neighborsOf = (
  image: RgbaImage,
  parent: Rect,
  axis: Axis,
  start: number,
  end: number,
): Neighbors => {
  const offset = axis === "rows" ? parent.y : parent.x;
  const size = axis === "rows" ? image.height : image.width;
  return {
    before: offset + start > 0 ? sliceRect(parent, axis, start - 1, 1) : null,
    after: offset + end < size ? sliceRect(parent, axis, end, 1) : null,
  };
};

/** Calls `matched` for every run of lines between the gaps, and `gap` for every gap, in order. */
const forEachRun = (
  gaps: LineSpan[],
  baselineCount: number,
  currentCount: number,
  handlers: {
    matched: (from: number, to: number, count: number) => void;
    gap: (gap: LineSpan) => void;
  },
) => {
  let baselineLine = 0;
  let currentLine = 0;
  for (const gap of gaps) {
    if (gap.baselineStart > baselineLine) {
      handlers.matched(baselineLine, currentLine, gap.baselineStart - baselineLine);
    }
    handlers.gap(gap);
    baselineLine = gap.baselineEnd;
    currentLine = gap.currentEnd;
  }
  const remaining = Math.min(baselineCount - baselineLine, currentCount - currentLine);
  if (remaining > 0) {
    handlers.matched(baselineLine, currentLine, remaining);
  }
};

/**
 * Whether the lines two sides of an uneven gap have in common look more alike
 * paired at the end of the gap than at the start. A few lines are sampled.
 */
const pairsBetterAtEnd = (
  context: Context,
  pair: RectPair,
  axis: Axis,
  gap: LineSpan,
  overlap: number,
) => {
  let start = 0;
  let end = 0;
  for (const offset of new Set([0, overlap >> 1, overlap - 1])) {
    const baselineStart = sliceRect(pair.baseline, axis, gap.baselineStart + offset, 1);
    const baselineEnd = sliceRect(pair.baseline, axis, gap.baselineEnd - overlap + offset, 1);
    start += equalPixels(
      context,
      baselineStart,
      sliceRect(pair.current, axis, gap.currentStart + offset, 1),
    );
    end += equalPixels(
      context,
      baselineEnd,
      sliceRect(pair.current, axis, gap.currentEnd - overlap + offset, 1),
    );
  }
  return end > start;
};

/**
 * Lines up a baseline rect with a current rect along an axis, copying the
 * lines that match. Each gap is lined up again along the other axis, up to a
 * fixed depth; whatever is left is compared in place.
 */
const alignRects = (
  context: Context,
  pair: RectPair,
  axis: Axis,
  depth: number,
  parentMatchedNothing: boolean,
  rows?: { baselineHashes: Float64Array; alignment: LineAlignment },
) => {
  const baselineHashes = rows?.baselineHashes ?? hashLines(context.baseline, pair.baseline, axis);
  const { gaps, matchedCount } =
    rows?.alignment ?? alignLines(baselineHashes, hashLines(context.current, pair.current, axis));
  // When neither this axis nor the one before matched anything, going deeper
  // would only repeat the same two alignments on the same rect.
  const recurse = depth < MAX_DEPTH && !(matchedCount === 0 && parentMatchedNothing);

  forEachRun(gaps, lineCount(pair.baseline, axis), lineCount(pair.current, axis), {
    matched: (from, to, count) =>
      copyRect(context, {
        baseline: sliceRect(pair.baseline, axis, from, count),
        current: sliceRect(pair.current, axis, to, count),
      }),
    gap: (gap) => {
      const baselineCount = gap.baselineEnd - gap.baselineStart;
      const currentCount = gap.currentEnd - gap.currentStart;
      const overlap = Math.min(baselineCount, currentCount);
      // When one side has extra lines, the rest are paired at whichever end
      // of the gap they look more like.
      const atEnd =
        baselineCount !== currentCount &&
        overlap > 0 &&
        pairsBetterAtEnd(context, pair, axis, gap, overlap);
      const baselinePaired = atEnd ? gap.baselineEnd - overlap : gap.baselineStart;
      const currentPaired = atEnd ? gap.currentEnd - overlap : gap.currentStart;
      const baselineExtra = atEnd ? gap.baselineStart : gap.baselineStart + overlap;
      const currentExtra = atEnd ? gap.currentStart : gap.currentStart + overlap;

      if (overlap > 0) {
        const lines: RectPair = {
          baseline: sliceRect(pair.baseline, axis, baselinePaired, overlap),
          current: sliceRect(pair.current, axis, currentPaired, overlap),
        };
        if (recurse) {
          alignRects(context, lines, otherAxis(axis), depth + 1, matchedCount === 0);
        } else {
          copyRect(context, lines);
        }
      }
      const neighbors = neighborsOf(
        context.baseline,
        pair.baseline,
        axis,
        baselineExtra,
        baselineExtra + baselineCount - overlap,
      );
      if (currentCount > overlap) {
        fillInserted(
          context,
          sliceRect(pair.current, axis, currentExtra, currentCount - overlap),
          axis,
          neighbors,
          depth > 0,
        );
      }
      if (baselineCount > overlap) {
        const removed = sliceRect(pair.baseline, axis, baselineExtra, baselineCount - overlap);
        const content = deletedContent(context, removed, axis, neighbors);
        const at = sliceRect(pair.current, axis, currentExtra, 0);
        if (!content) {
          context.removedSpace.push({ current: at, baseline: removed, nested: depth > 0 });
        } else {
          context.deletions.push({
            current:
              axis === "rows"
                ? {
                    ...at,
                    x: content.x - pair.baseline.x + pair.current.x,
                    width: content.width,
                  }
                : {
                    ...at,
                    y: content.y - pair.baseline.y + pair.current.y,
                    height: content.height,
                  },
            baseline: content,
          });
        }
      }
    },
  });
};

/** How many leading and trailing rows two images share, such as a header and footer. */
const commonEnds = (baseline: Float64Array, current: Float64Array) => {
  const limit = Math.min(baseline.length, current.length);
  let prefix = 0;
  while (prefix < limit && baseline[prefix] === current[prefix]) {
    prefix++;
  }
  let suffix = 0;
  while (
    suffix < limit - prefix &&
    baseline[baseline.length - 1 - suffix] === current[current.length - 1 - suffix]
  ) {
    suffix++;
  }
  return { prefix, suffix };
};

/**
 * Side-by-side columns of a band, separated by gutters that are one solid
 * color in both images, like a fixed sidebar next to a main column whose
 * content moved.
 */
const findStrips = (context: Context, band: RectPair): { x: number; width: number }[] => {
  const strips: { x: number; width: number }[] = [];
  let start = -1;
  for (let x = 0; x <= band.current.width; x++) {
    const color =
      x < band.current.width ? solidColumnColor(context.baseline, band.baseline, x) : null;
    const isGutter =
      x === band.current.width ||
      (color !== null && color === solidColumnColor(context.current, band.current, x));
    if (isGutter && start >= 0) {
      strips.push({ x: start, width: x - start });
      start = -1;
    } else if (!isGutter && start < 0) {
      start = x;
    }
  }
  return strips;
};

/**
 * How many lines an alignment accounts for: lines that match, plus inserted
 * lines that repeat the baseline line next to them, like blank space that grew.
 */
const linesCovered = (
  baseline: Float64Array,
  current: Float64Array,
  { matchedCount, gaps }: LineAlignment,
) => {
  let covered = matchedCount;
  for (const gap of gaps) {
    const before = baseline[gap.baselineStart - 1];
    const after = baseline[gap.baselineEnd];
    const overlap = Math.min(
      gap.baselineEnd - gap.baselineStart,
      gap.currentEnd - gap.currentStart,
    );
    for (let line = gap.currentStart + overlap; line < gap.currentEnd; line++) {
      covered += current[line] === before || current[line] === after ? 1 : 0;
    }
  }
  return covered;
};

/**
 * How many pixels lining up the whole image accounts for: rows, plus columns
 * inside the rows that don't line up.
 */
const wholeCoverage = (
  baseline: RgbaImage,
  current: RgbaImage,
  rows: {
    baselineHashes: Float64Array;
    currentHashes: Float64Array;
    alignment: LineAlignment;
  },
) => {
  let covered =
    linesCovered(rows.baselineHashes, rows.currentHashes, rows.alignment) * current.width;
  for (const gap of rows.alignment.gaps) {
    const overlap = Math.min(
      gap.baselineEnd - gap.baselineStart,
      gap.currentEnd - gap.currentStart,
    );
    if (overlap > 0) {
      const baselineColumns = hashLines(
        baseline,
        { x: 0, y: gap.baselineStart, width: baseline.width, height: overlap },
        "columns",
      );
      const currentColumns = hashLines(
        current,
        { x: 0, y: gap.currentStart, width: current.width, height: overlap },
        "columns",
      );
      const columns = alignLines(baselineColumns, currentColumns);
      covered += linesCovered(baselineColumns, currentColumns, columns) * overlap;
    }
  }
  return covered;
};

/**
 * Rearranges the baseline into the current image's coordinates. Rows are lined
 * up first, then columns inside the rows that changed, and so on to a fixed
 * depth. When the band between a shared header and footer splits into strips
 * at solid gutters, and lining the strips up separately matches more rows,
 * each strip is lined up on its own.
 *
 * Both images must have the same width. The work is a fixed number of passes
 * over the pixels, whatever changed.
 */
export const alignImages = (baseline: RgbaImage, current: RgbaImage): Alignment => {
  const aligned = new Uint8Array(current.width * current.height * 4);
  const context: Context = {
    baseline,
    current,
    baselineWords: pixelWords(baseline),
    currentWords: pixelWords(current),
    alignedWords: new Uint32Array(aligned.buffer),
    sources: Array.from({ length: current.height }, () => []),
    insertions: [],
    deletions: [],
    removedSpace: [],
    shifted: baseline.height !== current.height,
  };
  const whole: RectPair = {
    baseline: { x: 0, y: 0, width: baseline.width, height: baseline.height },
    current: { x: 0, y: 0, width: current.width, height: current.height },
  };
  const baselineRows = hashLines(baseline, whole.baseline, "rows");
  const currentRows = hashLines(current, whole.current, "rows");
  const wholeAlignment = alignLines(baselineRows, currentRows);

  const { prefix, suffix } = commonEnds(baselineRows, currentRows);
  const band: RectPair = {
    baseline: sliceRect(whole.baseline, "rows", prefix, baseline.height - prefix - suffix),
    current: sliceRect(whole.current, "rows", prefix, current.height - prefix - suffix),
  };
  const strips =
    band.baseline.height > 0 && band.current.height > 0 ? findStrips(context, band) : [];
  const stripPairs = strips.map(({ x, width }) => {
    const pair: RectPair = {
      baseline: { ...band.baseline, x, width },
      current: { ...band.current, x, width },
    };
    const baselineHashes = hashLines(baseline, pair.baseline, "rows");
    const currentHashes = hashLines(current, pair.current, "rows");
    const alignment = alignLines(baselineHashes, currentHashes);
    return {
      pair,
      rows: { baselineHashes, alignment },
      covered: linesCovered(baselineHashes, currentHashes, alignment),
    };
  });
  // Gutters match on every row the band shares.
  const stripWidth = strips.reduce((sum, { width }) => sum + width, 0);
  const stripCoverage = stripPairs.reduce(
    (sum, { pair, covered }) => sum + covered * pair.current.width,
    (prefix + suffix) * current.width +
      (current.width - stripWidth) * Math.min(band.baseline.height, band.current.height),
  );

  if (
    stripPairs.length === 0 ||
    stripCoverage <=
      wholeCoverage(baseline, current, {
        baselineHashes: baselineRows,
        currentHashes: currentRows,
        alignment: wholeAlignment,
      })
  ) {
    alignRects(context, whole, "rows", 0, false, {
      baselineHashes: baselineRows,
      alignment: wholeAlignment,
    });
  } else {
    copyRect(context, {
      baseline: sliceRect(whole.baseline, "rows", 0, prefix),
      current: sliceRect(whole.current, "rows", 0, prefix),
    });
    copyRect(context, {
      baseline: sliceRect(whole.baseline, "rows", baseline.height - suffix, suffix),
      current: sliceRect(whole.current, "rows", current.height - suffix, suffix),
    });
    // Gutters are one solid color, so the band is first copied in place,
    // stretched to the current height, and the strips then overwrite it.
    const shared = Math.min(band.baseline.height, band.current.height);
    for (let row = 0; row < band.current.height; row++) {
      copyRect(context, {
        baseline: sliceRect(band.baseline, "rows", Math.min(row, shared - 1), 1),
        current: sliceRect(band.current, "rows", row, 1),
      });
    }
    for (const { pair, rows } of stripPairs) {
      alignRects(context, pair, "rows", 0, false, rows);
    }
  }

  return {
    aligned,
    sources: context.sources,
    insertions: context.insertions,
    deletions: context.deletions,
    removedSpace: context.removedSpace,
    shifted: context.shifted || context.insertions.length > 0 || context.deletions.length > 0,
  };
};
