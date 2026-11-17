import pixelmatch from "pixelmatch";

import type { DiffImage } from "./analyzeDiff";

/**
 * Alignment-aware screenshot diff.
 *
 * A plain pixel diff compares (x, y) in the baseline with (x, y) in the
 * current image, so content inserted near the top makes everything below it
 * look changed. This module aligns the two images first and diffs only what
 * could not be aligned:
 *
 * 1. Hash every pixel row and run a Myers diff over the two lists of row
 *    hashes (the algorithm `git diff` runs over lines). Equal rows are
 *    matched even when they moved; the unmatched runs between them are gaps.
 * 2. Each gap is explained again, alternating axes: a gap of rows is aligned
 *    by its pixel columns (which isolates horizontal shifts), a gap of columns
 *    by its rows, down to a depth limit.
 * 3. Every gap keeps the cheapest of several explanations: a direct pixelmatch
 *    (when both sides are the same size), the recursive alignment, or sliding
 *    the shorter side along the longer one and calling the rest inserted or
 *    deleted. Cost counts "ink": pixels that differ in a pixelmatch, plus
 *    inserted or deleted pixels that differ from their area's background, so
 *    inserting blank space is cheap and spurious alignments lose to a direct
 *    comparison.
 */

const PIXELMATCH_THRESHOLD = 0.1;
const MAX_DEPTH = 6;
const MAX_STRIP_DEPTH = 3;
const DEFAULT_MAX_EDIT_RATIO = 0.6;
const MIN_EDIT_BUDGET = 64;
const MAX_EDIT_BUDGET = 1000;
const MAX_PATIENCE_DEPTH = 64;
const MAX_SLIDE_WORK = 40_000_000;
const REGION_MERGE_DISTANCE = 12;

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DiffRegionKind = "modified" | "inserted" | "deleted";

export type DiffRegion = {
  kind: DiffRegionKind;
  /** Where the region sits in the current image. Zero height or width for deletions. */
  current: Rect;
  /** Where the region sits in the baseline image. Zero height or width for insertions. */
  baseline: Rect;
};

export type AlignedDiffOptions = {
  /**
   * Give up aligning an axis when inserted plus deleted lines exceed this
   * share of the lines on that axis. Keeps unrelated images fast.
   */
  maxEditRatio?: number;
};

export type AlignedDiff = {
  width: number;
  height: number;
  /** Changed pixels after alignment, in current-image coordinates. */
  changedPixelCount: number;
  /** Changed pixels a plain position-by-position pixelmatch reports. */
  naivePixelCount: number;
  regions: DiffRegion[];
  /** One byte per current-image pixel: 1 where the pixel changed. */
  mask: Uint8Array;
};

type Axis = "rows" | "columns";

type Gap = {
  baselineStart: number;
  baselineEnd: number;
  currentStart: number;
  currentEnd: number;
};

type LineAlignment = {
  gaps: Gap[];
  matchedCount: number;
};

/** A changed area of the current image; `mask` is local to `rect`. */
type Change = {
  rect: Rect;
  mask: Uint8Array;
};

type Outcome = {
  cost: number;
  changes: Change[];
  regions: DiffRegion[];
};

type Context = {
  baseline: DiffImage;
  current: DiffImage;
  maxEditRatio: number;
};

const EMPTY: Outcome = { cost: 0, changes: [], regions: [] };

const isEmpty = (rect: Rect) => rect.width === 0 || rect.height === 0;

const combine = (outcomes: Outcome[]): Outcome => ({
  cost: outcomes.reduce((sum, outcome) => sum + outcome.cost, 0),
  changes: outcomes.flatMap((outcome) => outcome.changes),
  regions: outcomes.flatMap((outcome) => outcome.regions),
});

const pixelAt = (image: DiffImage, x: number, y: number): number => {
  const index = (y * image.width + x) * 4;
  const { data } = image;
  return (
    (data[index]! |
      (data[index + 1]! << 8) |
      (data[index + 2]! << 16) |
      (data[index + 3]! << 24)) >>>
    0
  );
};

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** Hashes each line of a rect along an axis into one collision-resistant number. */
const hashLines = (image: DiffImage, rect: Rect, axis: Axis): Float64Array => {
  const lineCount = axis === "rows" ? rect.height : rect.width;
  const lineLength = axis === "rows" ? rect.width : rect.height;
  const hashes = new Float64Array(lineCount);

  for (let line = 0; line < lineCount; line++) {
    let first = FNV_OFFSET;
    let second = 0;
    for (let step = 0; step < lineLength; step++) {
      const pixel =
        axis === "rows"
          ? pixelAt(image, rect.x + step, rect.y + line)
          : pixelAt(image, rect.x + line, rect.y + step);
      first = Math.imul(first ^ pixel, FNV_PRIME) >>> 0;
      second = (Math.imul(second, 31) + pixel) >>> 0;
    }
    hashes[line] = first * 0x100000 + (second & 0xfffff);
  }

  return hashes;
};

/** A run of `length` equal lines starting at `baseline` and `current`. */
type Match = [baseline: number, current: number, length: number];

/**
 * Myers' O(ND) diff of baseline[aStart, aEnd) against current[bStart, bEnd).
 * Returns the matched runs, or null when it needs more than `maxEdits`
 * edits. Memory is O(D^2) for the trace.
 */
const myers = (
  a: Float64Array,
  b: Float64Array,
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
  maxEdits: number,
): Match[] | null => {
  const aLength = aEnd - aStart;
  const bLength = bEnd - bStart;
  const limit = Math.min(maxEdits, aLength + bLength);
  const offset = limit + 1;
  const frontier = new Int32Array(2 * limit + 3);
  // trace[e] keeps the frontier window k in [-e-1, e+1] after e edits.
  const trace: Int32Array[] = [];
  let finalEdits = -1;

  outer: for (let edits = 0; edits <= limit; edits++) {
    for (let k = -edits; k <= edits; k += 2) {
      const goDown =
        k === -edits || (k !== edits && frontier[offset + k - 1]! < frontier[offset + k + 1]!);
      let x = goDown ? frontier[offset + k + 1]! : frontier[offset + k - 1]! + 1;
      let y = x - k;
      while (x < aLength && y < bLength && a[aStart + x] === b[bStart + y]) {
        x++;
        y++;
      }
      frontier[offset + k] = x;
      if (x >= aLength && y >= bLength) {
        finalEdits = edits;
        break outer;
      }
    }
    trace.push(frontier.slice(offset - edits - 1, offset + edits + 2));
  }
  if (finalEdits < 0) {
    return null;
  }

  // Walk back through the frontiers to recover the matched diagonal runs.
  const matches: Match[] = [];
  let x = aLength;
  let y = bLength;
  for (let edits = finalEdits; edits > 0; edits--) {
    // The window of step edits - 1 starts at k = -edits.
    const previous = trace[edits - 1]!;
    const k = x - y;
    const goDown =
      k === -edits || (k !== edits && previous[k - 1 + edits]! < previous[k + 1 + edits]!);
    const previousK = goDown ? k + 1 : k - 1;
    const previousX = previous[previousK + edits]!;
    const previousY = previousX - previousK;
    const startX = goDown ? previousX : previousX + 1;
    const startY = goDown ? previousY + 1 : previousY;
    if (x > startX) {
      matches.push([aStart + startX, bStart + startY, x - startX]);
    }
    x = previousX;
    y = previousY;
  }
  if (x > 0) {
    matches.push([aStart, bStart, x]);
  }
  return matches.reverse();
};

/**
 * Lines that occur exactly once in each range, paired up, in the longest
 * order-preserving chain (patience sorting). These are the anchors of
 * patience diff.
 */
const uniqueAnchors = (
  a: Float64Array,
  b: Float64Array,
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): Array<[number, number]> => {
  // For each hash: occurrences in a, position in a, occurrences in b, position in b.
  const seen = new Map<number, [number, number, number, number]>();
  for (let index = aStart; index < aEnd; index++) {
    const entry = seen.get(a[index]!);
    if (entry) {
      entry[0]++;
    } else {
      seen.set(a[index]!, [1, index, 0, -1]);
    }
  }
  for (let index = bStart; index < bEnd; index++) {
    const entry = seen.get(b[index]!);
    if (entry) {
      entry[2]++;
      entry[3] = index;
    }
  }

  const pairs: Array<[number, number]> = [];
  for (const [aCount, aIndex, bCount, bIndex] of seen.values()) {
    if (aCount === 1 && bCount === 1) {
      pairs.push([aIndex, bIndex]);
    }
  }
  pairs.sort((first, second) => first[0] - second[0]);

  // Longest increasing subsequence of b positions, O(k log k).
  const tails: number[] = [];
  const previous = new Int32Array(pairs.length);
  for (let index = 0; index < pairs.length; index++) {
    const value = pairs[index]![1];
    let low = 0;
    let high = tails.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (pairs[tails[middle]!]![1] < value) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    previous[index] = low > 0 ? tails[low - 1]! : -1;
    tails[low] = index;
  }
  const chain: Array<[number, number]> = [];
  for (let index = tails.length > 0 ? tails.at(-1)! : -1; index >= 0; index = previous[index]!) {
    chain.push(pairs[index]!);
  }
  return chain.reverse();
};

/**
 * Patience diff: match common leading and trailing lines, anchor on lines
 * unique to both sides, and recurse into the stretches between anchors. A
 * stretch with no anchors is handed to Myers with a small edit budget, and is
 * left unmatched when it needs more. Stays near O(n log n) where plain Myers
 * would be O(n * d).
 */
const patience = (
  a: Float64Array,
  b: Float64Array,
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
  maxEdits: number,
  out: Match[],
  depth = 0,
) => {
  let prefix = 0;
  while (
    aStart + prefix < aEnd &&
    bStart + prefix < bEnd &&
    a[aStart + prefix] === b[bStart + prefix]
  ) {
    prefix++;
  }
  if (prefix > 0) {
    out.push([aStart, bStart, prefix]);
  }
  aStart += prefix;
  bStart += prefix;

  let suffix = 0;
  while (
    aEnd - suffix > aStart &&
    bEnd - suffix > bStart &&
    a[aEnd - 1 - suffix] === b[bEnd - 1 - suffix]
  ) {
    suffix++;
  }
  const suffixMatch: Match | null = suffix > 0 ? [aEnd - suffix, bEnd - suffix, suffix] : null;
  aEnd -= suffix;
  bEnd -= suffix;

  if (aStart < aEnd && bStart < bEnd) {
    // Past the depth limit, skip anchoring so adversarial input cannot
    // exhaust the stack.
    const anchors =
      depth < MAX_PATIENCE_DEPTH ? uniqueAnchors(a, b, aStart, aEnd, bStart, bEnd) : [];
    if (anchors.length > 0) {
      let aCursor = aStart;
      let bCursor = bStart;
      for (const [aIndex, bIndex] of anchors) {
        patience(a, b, aCursor, aIndex, bCursor, bIndex, maxEdits, out, depth + 1);
        out.push([aIndex, bIndex, 1]);
        aCursor = aIndex + 1;
        bCursor = bIndex + 1;
      }
      patience(a, b, aCursor, aEnd, bCursor, bEnd, maxEdits, out, depth + 1);
    } else {
      const matches = myers(a, b, aStart, aEnd, bStart, bEnd, maxEdits);
      if (matches) {
        out.push(...matches);
      }
    }
  }

  if (suffixMatch) {
    out.push(suffixMatch);
  }
};

/** Aligns two lists of line hashes and returns the gaps between matched lines. */
const diffLines = (
  baseline: Float64Array,
  current: Float64Array,
  maxEdits: number,
): LineAlignment => {
  const matches: Match[] = [];
  patience(baseline, current, 0, baseline.length, 0, current.length, maxEdits, matches);

  const gaps: Gap[] = [];
  let baselineCursor = 0;
  let currentCursor = 0;
  let matchedCount = 0;
  const pushGap = (baselineEnd: number, currentEnd: number) => {
    if (baselineEnd > baselineCursor || currentEnd > currentCursor) {
      gaps.push({
        baselineStart: baselineCursor,
        baselineEnd,
        currentStart: currentCursor,
        currentEnd,
      });
    }
  };
  for (const [baselineStart, currentStart, length] of matches) {
    pushGap(baselineStart, currentStart);
    baselineCursor = baselineStart + length;
    currentCursor = currentStart + length;
    matchedCount += length;
  }
  pushGap(baseline.length, current.length);

  return { gaps, matchedCount };
};

const crop = (image: DiffImage, rect: Rect): Uint8Array => {
  const out = new Uint8Array(rect.width * rect.height * 4);
  for (let row = 0; row < rect.height; row++) {
    const start = ((rect.y + row) * image.width + rect.x) * 4;
    out.set(image.data.subarray(start, start + rect.width * 4), row * rect.width * 4);
  }
  return out;
};

const CLUSTER_CELL = 8;

const boundingBoxOfMask = (mask: Uint8Array, rect: Rect): Rect | null => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let row = 0; row < rect.height; row++) {
    for (let column = 0; column < rect.width; column++) {
      if (mask[row * rect.width + column]) {
        minX = Math.min(minX, column);
        minY = Math.min(minY, row);
        maxX = Math.max(maxX, column);
        maxY = Math.max(maxY, row);
      }
    }
  }
  if (maxX < 0) {
    return null;
  }
  return { x: rect.x + minX, y: rect.y + minY, width: maxX - minX + 1, height: maxY - minY + 1 };
};

/**
 * Groups the set pixels of a mask into clusters: pixels are bucketed into
 * cells, and cells that touch (including diagonally) form one cluster.
 * Returns each cluster's exact pixel bounding box in image coordinates.
 */
const clustersOfMask = (mask: Uint8Array, rect: Rect): Rect[] => {
  const columns = Math.ceil(rect.width / CLUSTER_CELL);
  const rows = Math.ceil(rect.height / CLUSTER_CELL);
  const boxes: Array<[number, number, number, number] | null> = Array.from(
    { length: columns * rows },
    () => null,
  );
  for (let y = 0; y < rect.height; y++) {
    for (let x = 0; x < rect.width; x++) {
      if (!mask[y * rect.width + x]) {
        continue;
      }
      const cell = Math.floor(y / CLUSTER_CELL) * columns + Math.floor(x / CLUSTER_CELL);
      const box = boxes[cell];
      if (box) {
        box[0] = Math.min(box[0], x);
        box[1] = Math.min(box[1], y);
        box[2] = Math.max(box[2], x);
        box[3] = Math.max(box[3], y);
      } else {
        boxes[cell] = [x, y, x, y];
      }
    }
  }

  const visited = new Uint8Array(columns * rows);
  const clusters: Rect[] = [];
  for (let start = 0; start < boxes.length; start++) {
    if (!boxes[start] || visited[start]) {
      continue;
    }
    const stack = [start];
    visited[start] = 1;
    let [minX, minY, maxX, maxY] = boxes[start]!;
    while (stack.length > 0) {
      const cell = stack.pop()!;
      const box = boxes[cell]!;
      minX = Math.min(minX, box[0]);
      minY = Math.min(minY, box[1]);
      maxX = Math.max(maxX, box[2]);
      maxY = Math.max(maxY, box[3]);
      const cellX = cell % columns;
      const cellY = Math.floor(cell / columns);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cellX + dx;
          const ny = cellY + dy;
          const neighbor = ny * columns + nx;
          if (
            nx >= 0 &&
            ny >= 0 &&
            nx < columns &&
            ny < rows &&
            boxes[neighbor] &&
            !visited[neighbor]
          ) {
            visited[neighbor] = 1;
            stack.push(neighbor);
          }
        }
      }
    }
    clusters.push({
      x: rect.x + minX,
      y: rect.y + minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    });
  }
  return clusters;
};

/** Pixelmatch of two same-size rects, as a "modified" outcome. */
const compareSameSize = (context: Context, baselineRect: Rect, currentRect: Rect): Outcome => {
  const { width, height } = currentRect;
  const output = new Uint8Array(width * height * 4);
  const count = pixelmatch(
    crop(context.baseline, baselineRect),
    crop(context.current, currentRect),
    output,
    width,
    height,
    { threshold: PIXELMATCH_THRESHOLD, diffMask: true, diffColor: [255, 0, 0] },
  );
  if (count === 0) {
    return EMPTY;
  }

  const mask = maskFromOutput(output, width * height);

  return {
    cost: count,
    changes: [{ rect: currentRect, mask }],
    regions: clustersOfMask(mask, currentRect).map((changed) => ({
      kind: "modified",
      current: changed,
      baseline: {
        x: baselineRect.x + changed.x - currentRect.x,
        y: baselineRect.y + changed.y - currentRect.y,
        width: changed.width,
        height: changed.height,
      },
    })),
  };
};

/** The most common pixel of a rect, sampled. */
const backgroundOf = (image: DiffImage, rect: Rect): number => {
  const step = Math.max(1, Math.floor(Math.sqrt((rect.width * rect.height) / 4096)));
  const counts = new Map<number, number>();
  let best = 0;
  let bestCount = 0;
  for (let row = 0; row < rect.height; row += step) {
    for (let column = 0; column < rect.width; column += step) {
      const pixel = pixelAt(image, rect.x + column, rect.y + row);
      const count = (counts.get(pixel) ?? 0) + 1;
      counts.set(pixel, count);
      if (count > bestCount) {
        best = pixel;
        bestCount = count;
      }
    }
  }
  return best;
};

const maskFromOutput = (output: Uint8Array, length: number): Uint8Array => {
  const mask = new Uint8Array(length);
  for (let index = 0; index < length; index++) {
    mask[index] = output[index * 4 + 3] !== 0 && output[index * 4 + 1] === 0 ? 1 : 0;
  }
  return mask;
};

/** Pixelmatch of a rect against a same-size reference, as a mask and a count. */
const inkAgainst = (image: DiffImage, rect: Rect, reference: Uint8Array) => {
  const output = new Uint8Array(reference.length);
  const count = pixelmatch(reference, crop(image, rect), output, rect.width, rect.height, {
    threshold: PIXELMATCH_THRESHOLD,
    diffMask: true,
    diffColor: [255, 0, 0],
  });
  return { mask: maskFromOutput(output, rect.width * rect.height), count };
};

/** A rect-sized buffer that repeats one line of the image across the rect. */
const repeatLine = (image: DiffImage, rect: Rect, axis: Axis, line: number): Uint8Array => {
  const out = new Uint8Array(rect.width * rect.height * 4);
  const view = new Uint32Array(out.buffer);
  for (let row = 0; row < rect.height; row++) {
    for (let column = 0; column < rect.width; column++) {
      view[row * rect.width + column] =
        axis === "rows"
          ? pixelAt(image, rect.x + column, line)
          : pixelAt(image, line, rect.y + row);
    }
  }
  return out;
};

/**
 * Marks the pixels of an inserted or deleted slice that are actual content.
 * The slice is compared with the line just outside it repeated across the
 * slice, so stretched whitespace, longer borders and wider backgrounds cost
 * nothing. Uses the same perceptual metric as the in-place comparison so the
 * costs of different explanations stay comparable.
 */
const inkMask = (image: DiffImage, rect: Rect, axis: Axis): { mask: Uint8Array; count: number } => {
  const start = axis === "rows" ? rect.y : rect.x;
  const end = start + (axis === "rows" ? rect.height : rect.width);
  const limit = axis === "rows" ? image.height : image.width;
  const neighbors = [start - 1, end].filter((line) => line >= 0 && line < limit);

  if (neighbors.length === 0) {
    const fill = new Uint8Array(rect.width * rect.height * 4);
    new Uint32Array(fill.buffer).fill(backgroundOf(image, rect));
    return inkAgainst(image, rect, fill);
  }

  return neighbors
    .map((line) => inkAgainst(image, rect, repeatLine(image, rect, axis, line)))
    .reduce((best, candidate) => (candidate.count < best.count ? candidate : best));
};

/** The axis along which an empty rect has no extent. */
const emptyAxis = (rect: Rect): Axis => (rect.height === 0 ? "rows" : "columns");

const inserted = (context: Context, currentRect: Rect, baselineAt: Rect): Outcome => {
  const { mask, count } = inkMask(context.current, currentRect, emptyAxis(baselineAt));
  const ink = boundingBoxOfMask(mask, currentRect);
  // Blank space that appeared only moves content; the move is not a change.
  if (count === 0 || !ink) {
    return EMPTY;
  }
  return {
    cost: count,
    changes: [{ rect: currentRect, mask }],
    regions: [{ kind: "inserted", current: ink, baseline: baselineAt }],
  };
};

const deleted = (context: Context, baselineRect: Rect, currentAt: Rect): Outcome => {
  const axis = emptyAxis(currentAt);
  const { mask, count } = inkMask(context.baseline, baselineRect, axis);
  const ink = boundingBoxOfMask(mask, baselineRect);
  // Blank space that disappeared only moves content; the move is not a change.
  if (count === 0 || !ink) {
    return EMPTY;
  }
  // Mark the deletion as a line in the current image, spanning only the
  // extent of the content that was removed.
  const current =
    axis === "rows"
      ? { x: currentAt.x + ink.x - baselineRect.x, y: currentAt.y, width: ink.width, height: 0 }
      : { x: currentAt.x, y: currentAt.y + ink.y - baselineRect.y, width: 0, height: ink.height };
  return {
    cost: count,
    changes: [],
    regions: [{ kind: "deleted", current, baseline: ink }],
  };
};

/** A rect of the given lines along an axis, spanning the whole cross extent. */
const slice = (rect: Rect, axis: Axis, start: number, length: number): Rect =>
  axis === "rows"
    ? { x: rect.x, y: rect.y + start, width: rect.width, height: length }
    : { x: rect.x + start, y: rect.y, width: length, height: rect.height };

/** Fast exact-mismatch count used to rank slide offsets before pixelmatch. */
const mismatchCount = (context: Context, baselineRect: Rect, currentRect: Rect): number => {
  let count = 0;
  for (let row = 0; row < currentRect.height; row++) {
    for (let column = 0; column < currentRect.width; column++) {
      if (
        pixelAt(context.baseline, baselineRect.x + column, baselineRect.y + row) !==
        pixelAt(context.current, currentRect.x + column, currentRect.y + row)
      ) {
        count++;
      }
    }
  }
  return count;
};

/**
 * Explains two rects whose sizes differ along one axis: places the shorter
 * one at the best offset inside the longer one, compares that part, and
 * reports the lines on either side as inserted or deleted.
 */
const slide = (context: Context, baselineRect: Rect, currentRect: Rect, axis: Axis): Outcome => {
  const baselineLength = axis === "rows" ? baselineRect.height : baselineRect.width;
  const currentLength = axis === "rows" ? currentRect.height : currentRect.width;
  const shorter = Math.min(baselineLength, currentLength);
  const extra = Math.abs(baselineLength - currentLength);
  const area = (axis === "rows" ? currentRect.width : currentRect.height) * shorter;
  const offsets =
    (extra + 1) * area <= MAX_SLIDE_WORK
      ? Array.from({ length: extra + 1 }, (_, index) => index)
      : [0, extra];
  const currentIsLonger = currentLength > baselineLength;

  const place = (offset: number) => ({
    baselinePart: slice(baselineRect, axis, currentIsLonger ? 0 : offset, shorter),
    currentPart: slice(currentRect, axis, currentIsLonger ? offset : 0, shorter),
  });

  let bestOffset = 0;
  let bestMismatch = Infinity;
  for (const offset of offsets) {
    const { baselinePart, currentPart } = place(offset);
    const mismatch = mismatchCount(context, baselinePart, currentPart);
    if (mismatch < bestMismatch) {
      bestOffset = offset;
      bestMismatch = mismatch;
    }
  }

  const { baselinePart, currentPart } = place(bestOffset);
  const outcomes = [compareSameSize(context, baselinePart, currentPart)];
  const before = bestOffset;
  const after = extra - bestOffset;
  if (currentIsLonger) {
    const baselineBefore = slice(baselineRect, axis, 0, 0);
    const baselineAfter = slice(baselineRect, axis, shorter, 0);
    if (before > 0) {
      outcomes.push(inserted(context, slice(currentRect, axis, 0, before), baselineBefore));
    }
    if (after > 0) {
      outcomes.push(
        inserted(context, slice(currentRect, axis, before + shorter, after), baselineAfter),
      );
    }
  } else {
    if (before > 0) {
      outcomes.push(
        deleted(context, slice(baselineRect, axis, 0, before), slice(currentRect, axis, 0, 0)),
      );
    }
    if (after > 0) {
      outcomes.push(
        deleted(
          context,
          slice(baselineRect, axis, before + shorter, after),
          slice(currentRect, axis, shorter, 0),
        ),
      );
    }
  }
  return combine(outcomes);
};

/** Last resort for rects that differ in both dimensions. */
const compareMismatched = (context: Context, baselineRect: Rect, currentRect: Rect): Outcome => {
  const width = Math.min(baselineRect.width, currentRect.width);
  const height = Math.min(baselineRect.height, currentRect.height);
  const overlap = compareSameSize(
    context,
    { ...baselineRect, width, height },
    { ...currentRect, width, height },
  );
  const extras = [
    {
      rect: {
        x: currentRect.x + width,
        y: currentRect.y,
        width: currentRect.width - width,
        height: currentRect.height,
      },
      axis: "columns" as const,
    },
    {
      rect: {
        x: currentRect.x,
        y: currentRect.y + height,
        width,
        height: currentRect.height - height,
      },
      axis: "rows" as const,
    },
  ]
    .filter(({ rect }) => !isEmpty(rect))
    .map(({ rect, axis }) => ({ rect, ...inkMask(context.current, rect, axis) }));
  return {
    cost: overlap.cost + extras.reduce((sum, extra) => sum + extra.count, 0),
    changes: [...overlap.changes, ...extras.map(({ rect, mask }) => ({ rect, mask }))],
    regions: [{ kind: "modified", current: currentRect, baseline: baselineRect }],
  };
};

const otherAxis = (axis: Axis): Axis => (axis === "rows" ? "columns" : "rows");

/** Aligns two rects along `axis`, then explains each gap along the other axis. */
const alignAlong = (
  context: Context,
  baselineRect: Rect,
  currentRect: Rect,
  axis: Axis,
  depth: number,
): Outcome | null => {
  const crossMatches =
    axis === "rows"
      ? baselineRect.width === currentRect.width
      : baselineRect.height === currentRect.height;
  if (!crossMatches) {
    return null;
  }

  const baselineLines = hashLines(context.baseline, baselineRect, axis);
  const currentLines = hashLines(context.current, currentRect, axis);
  const maxEdits = Math.min(
    MAX_EDIT_BUDGET,
    Math.max(
      MIN_EDIT_BUDGET,
      Math.ceil((baselineLines.length + currentLines.length) * context.maxEditRatio),
    ),
  );
  const alignment = diffLines(baselineLines, currentLines, maxEdits);
  if (alignment.matchedCount === 0) {
    return null;
  }

  return combine(
    alignment.gaps.map((gap) =>
      explain(
        context,
        slice(baselineRect, axis, gap.baselineStart, gap.baselineEnd - gap.baselineStart),
        slice(currentRect, axis, gap.currentStart, gap.currentEnd - gap.currentStart),
        otherAxis(axis),
        depth + 1,
      ),
    ),
  );
};

/** The colour of a column of a rect when every pixel in it is the same, else -1. */
const uniformColumn = (image: DiffImage, rect: Rect, x: number): number => {
  const color = pixelAt(image, x, rect.y);
  for (let row = 1; row < rect.height; row++) {
    if (pixelAt(image, x, rect.y + row) !== color) {
      return -1;
    }
  }
  return color;
};

/**
 * Explains two same-width rects as side-by-side strips that move vertically
 * on their own, like a fixed sidebar next to a main column whose content
 * shifted. Rows equal at the top and bottom (a full-width header and footer)
 * are matched first. In the band between them, columns of one solid colour in
 * both images are gutters; the band is cut at the gutters and each strip is
 * aligned by rows separately. Returns null when there are no gutters to cut at.
 */
const alignStrips = (
  context: Context,
  baselineRect: Rect,
  currentRect: Rect,
  depth: number,
): Outcome | null => {
  const baselineRows = hashLines(context.baseline, baselineRect, "rows");
  const currentRows = hashLines(context.current, currentRect, "rows");
  let prefix = 0;
  while (
    prefix < baselineRows.length &&
    prefix < currentRows.length &&
    baselineRows[prefix] === currentRows[prefix]
  ) {
    prefix++;
  }
  let suffix = 0;
  while (
    suffix < baselineRows.length - prefix &&
    suffix < currentRows.length - prefix &&
    baselineRows[baselineRows.length - 1 - suffix] === currentRows[currentRows.length - 1 - suffix]
  ) {
    suffix++;
  }
  const baselineBand = slice(baselineRect, "rows", prefix, baselineRect.height - prefix - suffix);
  const currentBand = slice(currentRect, "rows", prefix, currentRect.height - prefix - suffix);
  if (isEmpty(baselineBand) || isEmpty(currentBand)) {
    return null;
  }

  const strips: Array<[number, number]> = [];
  let stripStart = -1;
  for (let column = 0; column <= baselineBand.width; column++) {
    const isGutter =
      column === baselineBand.width ||
      (() => {
        const color = uniformColumn(context.baseline, baselineBand, baselineBand.x + column);
        return (
          color !== -1 &&
          color === uniformColumn(context.current, currentBand, currentBand.x + column)
        );
      })();
    if (isGutter && stripStart >= 0) {
      strips.push([stripStart, column]);
      stripStart = -1;
    } else if (!isGutter && stripStart < 0) {
      stripStart = column;
    }
  }
  if (strips.length < 2) {
    return null;
  }

  return combine(
    strips.map(([start, end]) =>
      explain(
        context,
        slice(baselineBand, "columns", start, end - start),
        slice(currentBand, "columns", start, end - start),
        "rows",
        depth + 1,
      ),
    ),
  );
};

/** Returns the cheapest explanation of how `baselineRect` became `currentRect`. */
const explain = (
  context: Context,
  baselineRect: Rect,
  currentRect: Rect,
  axis: Axis,
  depth: number,
): Outcome => {
  if (isEmpty(baselineRect) && isEmpty(currentRect)) {
    return EMPTY;
  }
  if (isEmpty(baselineRect)) {
    return inserted(context, currentRect, baselineRect);
  }
  if (isEmpty(currentRect)) {
    return deleted(context, baselineRect, currentRect);
  }

  const candidates: Outcome[] = [];
  const sameWidth = baselineRect.width === currentRect.width;
  const sameHeight = baselineRect.height === currentRect.height;

  if (sameWidth && sameHeight) {
    const direct = compareSameSize(context, baselineRect, currentRect);
    if (direct.cost === 0) {
      return direct;
    }
    candidates.push(direct);
  }

  if (depth <= MAX_DEPTH) {
    const aligned =
      alignAlong(context, baselineRect, currentRect, axis, depth) ??
      alignAlong(context, baselineRect, currentRect, otherAxis(axis), depth);
    if (aligned) {
      candidates.push(aligned);
    }
  }

  if (sameWidth && depth < MAX_STRIP_DEPTH) {
    const strips = alignStrips(context, baselineRect, currentRect, depth);
    if (strips) {
      candidates.push(strips);
    }
  }

  if (sameWidth && !sameHeight) {
    candidates.push(slide(context, baselineRect, currentRect, "rows"));
  } else if (sameHeight && !sameWidth) {
    candidates.push(slide(context, baselineRect, currentRect, "columns"));
  }

  if (candidates.length === 0) {
    return compareMismatched(context, baselineRect, currentRect);
  }

  return candidates.reduce((best, candidate) => (candidate.cost < best.cost ? candidate : best));
};

const near = (first: Rect, second: Rect, distance: number): boolean =>
  first.x <= second.x + second.width + distance &&
  second.x <= first.x + first.width + distance &&
  first.y <= second.y + second.height + distance &&
  second.y <= first.y + first.height + distance;

const union = (first: Rect, second: Rect): Rect => {
  const x = Math.min(first.x, second.x);
  const y = Math.min(first.y, second.y);
  return {
    x,
    y,
    width: Math.max(first.x + first.width, second.x + second.width) - x,
    height: Math.max(first.y + first.height, second.y + second.height) - y,
  };
};

const MERGE_GRID = 64;

/** One union-find pass: joins every pair of regions within merge distance. */
const mergePass = (regions: DiffRegion[]): DiffRegion[] => {
  const parent = regions.map((_, index) => index);
  const find = (index: number): number => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]!]!;
      index = parent[index]!;
    }
    return index;
  };

  // Bucket regions into a coarse grid so each one is only tested against
  // regions in the cells it touches.
  const grid = new Map<string, number[]>();
  regions.forEach((region, index) => {
    const { x, y, width, height } = region.current;
    const reach = REGION_MERGE_DISTANCE;
    for (
      let cy = Math.floor((y - reach) / MERGE_GRID);
      cy <= Math.floor((y + height + reach) / MERGE_GRID);
      cy++
    ) {
      for (
        let cx = Math.floor((x - reach) / MERGE_GRID);
        cx <= Math.floor((x + width + reach) / MERGE_GRID);
        cx++
      ) {
        const key = `${cx},${cy}`;
        const bucket = grid.get(key);
        if (bucket) {
          for (const other of bucket) {
            if (
              find(other) !== find(index) &&
              near(regions[other]!.current, region.current, reach)
            ) {
              parent[find(other)] = find(index);
            }
          }
          bucket.push(index);
        } else {
          grid.set(key, [index]);
        }
      }
    }
  });

  const groups = new Map<number, DiffRegion>();
  regions.forEach((region, index) => {
    const root = find(index);
    const existing = groups.get(root);
    groups.set(
      root,
      existing
        ? {
            kind: existing.kind === region.kind ? existing.kind : "modified",
            current: union(existing.current, region.current),
            baseline: union(existing.baseline, region.baseline),
          }
        : region,
    );
  });
  return [...groups.values()];
};

/**
 * Merges nearby regions so one visual change reads as one region. Merged
 * boxes can grow into new neighbours, so passes repeat until nothing changes.
 */
const mergeRegions = (regions: DiffRegion[]): DiffRegion[] => {
  let merged = regions;
  for (;;) {
    const next = mergePass(merged);
    if (next.length === merged.length) {
      break;
    }
    merged = next;
  }
  return merged.sort((a, b) => a.current.y - b.current.y || a.current.x - b.current.x);
};

const padTo = (image: DiffImage, width: number, height: number): Uint8Array => {
  if (image.width === width && image.height === height) {
    return image.data;
  }
  const data = new Uint8Array(width * height * 4);
  for (let row = 0; row < image.height; row++) {
    data.set(
      image.data.subarray(row * image.width * 4, (row + 1) * image.width * 4),
      row * width * 4,
    );
  }
  return data;
};

const naiveDiffCount = (baseline: DiffImage, current: DiffImage): number => {
  const width = Math.max(baseline.width, current.width);
  const height = Math.max(baseline.height, current.height);
  return pixelmatch(
    padTo(baseline, width, height),
    padTo(current, width, height),
    undefined,
    width,
    height,
    {
      threshold: PIXELMATCH_THRESHOLD,
    },
  );
};

export const alignedDiff = (
  baseline: DiffImage,
  current: DiffImage,
  options: AlignedDiffOptions = {},
): AlignedDiff => {
  const context: Context = {
    baseline,
    current,
    maxEditRatio: options.maxEditRatio ?? DEFAULT_MAX_EDIT_RATIO,
  };
  const outcome = explain(
    context,
    { x: 0, y: 0, width: baseline.width, height: baseline.height },
    { x: 0, y: 0, width: current.width, height: current.height },
    "rows",
    0,
  );

  const mask = new Uint8Array(current.width * current.height);
  for (const { rect, mask: local } of outcome.changes) {
    for (let row = 0; row < rect.height; row++) {
      for (let column = 0; column < rect.width; column++) {
        if (local[row * rect.width + column]) {
          mask[(rect.y + row) * current.width + rect.x + column] = 1;
        }
      }
    }
  }
  let changedPixelCount = 0;
  for (const value of mask) {
    changedPixelCount += value;
  }

  return {
    width: current.width,
    height: current.height,
    changedPixelCount,
    naivePixelCount: naiveDiffCount(baseline, current),
    regions: mergeRegions(outcome.regions),
    mask,
  };
};

/**
 * Renders the diff over a faded copy of the current image: changed pixels in
 * red, inserted regions tinted green, deletions drawn as a magenta line.
 */
export const renderAlignedDiff = (current: DiffImage, diff: AlignedDiff): DiffImage => {
  const { width, height } = current;
  const data = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index++) {
    const source = index * 4;
    const gray =
      0.299 * current.data[source]! +
      0.587 * current.data[source + 1]! +
      0.114 * current.data[source + 2]!;
    const faded = 255 - (255 - gray) * 0.25;
    data.set([faded, faded, faded, 255], source);
  }
  const blend = (index: number, color: [number, number, number], amount: number) => {
    for (let channel = 0; channel < 3; channel++) {
      data[index * 4 + channel] =
        data[index * 4 + channel]! * (1 - amount) + color[channel]! * amount;
    }
  };
  for (const region of diff.regions) {
    if (region.kind !== "inserted") {
      continue;
    }
    for (let row = 0; row < region.current.height; row++) {
      for (let column = 0; column < region.current.width; column++) {
        blend((region.current.y + row) * width + region.current.x + column, [60, 200, 90], 0.35);
      }
    }
  }
  for (let index = 0; index < diff.mask.length; index++) {
    if (diff.mask[index]) {
      blend(index, [230, 30, 30], 0.85);
    }
  }
  for (const region of diff.regions) {
    if (region.kind !== "deleted") {
      continue;
    }
    const { x, y } = region.current;
    const horizontal = region.current.height === 0;
    const length = horizontal
      ? Math.max(region.current.width, 1)
      : Math.max(region.current.height, 1);
    for (let step = 0; step < length; step++) {
      for (let thickness = -1; thickness <= 1; thickness++) {
        const px = horizontal ? x + step : x + thickness;
        const py = horizontal ? y + thickness : y + step;
        if (px >= 0 && py >= 0 && px < width && py < height) {
          blend(py * width + px, [220, 0, 220], 1);
        }
      }
    }
  }
  return { width, height, data };
};
