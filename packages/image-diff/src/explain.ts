import { alignLines } from "./alignLines";
import {
  boundingBox,
  clustersOf,
  compareRects,
  countBits,
  inkOf,
  type NeighbourSide,
} from "./masks";
import { countUnequalPixels, hashLines, solidColumnColor } from "./pixels";
import {
  emptyAxis,
  isEmptyRect,
  lineCount,
  lineLength,
  otherAxis,
  sliceRect,
  translateRect,
} from "./rect";
import type { Axis, Image, Mask, RectPair, Region } from "./types";

/**
 * Works out how a rect of the baseline became a rect of the current image.
 * We try a few explanations and keep whichever flags the fewest pixels:
 * compare in place, match rows (or columns) that only moved and recurse into
 * what's left, split into side-by-side strips that scroll on their own, or
 * slide the shorter side along the longer one.
 *
 * Added or removed lines only cost what they contain, so blank space that grew
 * or shrank is free and content that only moved never counts as a change.
 */

export type Explanation = {
  /** Changed pixels, plus content that was deleted from the baseline. */
  cost: number;
  /** Changed pixels in the current image. */
  masks: Mask[];
  regions: Region[];
};

type Images = {
  baseline: Image;
  current: Image;
};

/** How many times the axis can alternate before a gap is compared as is. */
const MAX_DEPTH = 6;
/** Strips are only looked for near the top of the recursion, where layout columns are. */
const MAX_STRIP_DEPTH = 3;
/** Pixel comparisons a slide may spend searching for its best offset. */
const MAX_SLIDE_WORK = 40_000_000;

const NOTHING: Explanation = { cost: 0, masks: [], regions: [] };

const combine = (explanations: Explanation[]): Explanation => ({
  cost: explanations.reduce((sum, explanation) => sum + explanation.cost, 0),
  masks: explanations.flatMap((explanation) => explanation.masks),
  regions: explanations.flatMap((explanation) => explanation.regions),
});

const cheapest = (explanations: Explanation[]): Explanation =>
  explanations.reduce((best, candidate) => (candidate.cost < best.cost ? candidate : best));

/** Compares two same-size rects pixel by pixel. Each cluster of changes is one region. */
const inPlace = (images: Images, pair: RectPair): Explanation => {
  const mask = compareRects(images.baseline, pair.baseline, images.current, pair.current);
  const cost = countBits(mask);
  if (cost === 0) {
    return NOTHING;
  }
  return {
    cost,
    masks: [mask],
    regions: clustersOf(mask).map((current) => ({
      kind: "modified",
      current,
      baseline: translateRect(current, pair.current, pair.baseline),
    })),
  };
};

/** Content that exists only in the current image. */
const inserted = (images: Images, pair: RectPair, side?: NeighbourSide): Explanation => {
  const ink = inkOf(images.current, pair.current, emptyAxis(pair.baseline), side);
  const bounds = boundingBox(ink);
  if (!bounds) {
    return NOTHING;
  }
  return {
    cost: countBits(ink),
    masks: [ink],
    regions: [{ kind: "inserted", current: bounds, baseline: pair.baseline }],
  };
};

/** Content that exists only in the baseline, marked as a line where it used to be. */
const deleted = (images: Images, pair: RectPair, side?: NeighbourSide): Explanation => {
  const axis = emptyAxis(pair.current);
  const ink = inkOf(images.baseline, pair.baseline, axis, side);
  const bounds = boundingBox(ink);
  if (!bounds) {
    return NOTHING;
  }
  const line = translateRect(bounds, pair.baseline, pair.current);
  return {
    cost: countBits(ink),
    masks: [],
    regions: [
      {
        kind: "deleted",
        current:
          axis === "rows"
            ? { ...line, y: pair.current.y, height: 0 }
            : { ...line, x: pair.current.x, width: 0 },
        baseline: bounds,
      },
    ],
  };
};

/**
 * For rects that differ in length along `axis` only: slides the shorter one
 * along the longer one, compares it at the offset with the fewest unequal
 * pixels, and reports the lines on either side as inserted or deleted.
 */
const slid = (images: Images, pair: RectPair, axis: Axis): Explanation => {
  const baselineLength = lineCount(pair.baseline, axis);
  const currentLength = lineCount(pair.current, axis);
  const shorter = Math.min(baselineLength, currentLength);
  const extra = Math.abs(baselineLength - currentLength);
  const currentIsLonger = currentLength > baselineLength;
  const work = (extra + 1) * shorter * lineLength(pair.current, axis);
  const offsets =
    work <= MAX_SLIDE_WORK ? Array.from({ length: extra + 1 }, (_, offset) => offset) : [0, extra];

  const placed = (offset: number): RectPair => ({
    baseline: sliceRect(pair.baseline, axis, currentIsLonger ? 0 : offset, shorter),
    current: sliceRect(pair.current, axis, currentIsLonger ? offset : 0, shorter),
  });
  const unequalAt = (offset: number) => {
    const { baseline, current } = placed(offset);
    return countUnequalPixels(images.baseline, baseline, images.current, current);
  };
  const offset = offsets
    .map((candidate) => ({ candidate, unequal: unequalAt(candidate) }))
    .reduce((best, next) => (next.unequal < best.unequal ? next : best)).candidate;

  const overlap = placed(offset);
  // Leftover lines sit against the compared overlap on one side, which may
  // itself be new content, so their ink is measured from the outer side only.
  const leftovers = [
    { start: 0, count: offset, side: "before" as const },
    { start: offset + shorter, count: extra - offset, side: "after" as const },
  ]
    .filter(({ count }) => count > 0)
    .map(({ start, count, side }) => {
      const edge = side === "before" ? 0 : shorter;
      return currentIsLonger
        ? inserted(
            images,
            {
              baseline: sliceRect(pair.baseline, axis, edge, 0),
              current: sliceRect(pair.current, axis, start, count),
            },
            side,
          )
        : deleted(
            images,
            {
              baseline: sliceRect(pair.baseline, axis, start, count),
              current: sliceRect(pair.current, axis, edge, 0),
            },
            side,
          );
    });
  return combine([inPlace(images, overlap), ...leftovers]);
};

/** Last resort for rects that differ in both width and height. */
const mismatched = (images: Images, pair: RectPair): Explanation => {
  const width = Math.min(pair.baseline.width, pair.current.width);
  const height = Math.min(pair.baseline.height, pair.current.height);
  const overlap = inPlace(images, {
    baseline: { ...pair.baseline, width, height },
    current: { ...pair.current, width, height },
  });
  const right = { ...pair.current, x: pair.current.x + width, width: pair.current.width - width };
  const below = {
    ...pair.current,
    y: pair.current.y + height,
    width,
    height: pair.current.height - height,
  };
  const extras = [
    { rect: right, axis: "columns" as const },
    { rect: below, axis: "rows" as const },
  ]
    .filter(({ rect }) => !isEmptyRect(rect))
    // These extras border the compared overlap, so only their outer side counts.
    .map(({ rect, axis }) => inkOf(images.current, rect, axis, "after"));
  return {
    cost: overlap.cost + extras.reduce((sum, ink) => sum + countBits(ink), 0),
    masks: [...overlap.masks, ...extras],
    regions: [{ kind: "modified", ...pair }],
  };
};

/** Matches lines along `axis` and explains each unmatched gap along the other axis. */
const aligned = (images: Images, pair: RectPair, axis: Axis, depth: number): Explanation | null => {
  if (lineLength(pair.baseline, axis) !== lineLength(pair.current, axis)) {
    return null;
  }
  const alignment = alignLines(
    hashLines(images.baseline, pair.baseline, axis),
    hashLines(images.current, pair.current, axis),
  );
  if (alignment.matchedCount === 0) {
    return null;
  }
  return combine(
    alignment.gaps.map((gap) =>
      explain(
        images,
        {
          baseline: sliceRect(
            pair.baseline,
            axis,
            gap.baselineStart,
            gap.baselineEnd - gap.baselineStart,
          ),
          current: sliceRect(
            pair.current,
            axis,
            gap.currentStart,
            gap.currentEnd - gap.currentStart,
          ),
        },
        otherAxis(axis),
        depth + 1,
      ),
    ),
  );
};

/** How many leading and trailing entries two hash lists share. */
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

/** Runs of columns [start, end) that are not gutters. */
const stripsBetween = (isGutter: boolean[]): Array<{ start: number; end: number }> =>
  isGutter.reduce<Array<{ start: number; end: number }>>((strips, gutter, column) => {
    const last = strips.at(-1);
    if (gutter) {
      return strips;
    }
    return last && last.end === column
      ? [...strips.slice(0, -1), { start: last.start, end: column + 1 }]
      : [...strips, { start: column, end: column + 1 }];
  }, []);

/**
 * Explains same-width rects as side-by-side strips that move vertically on
 * their own. Rows equal at the top and bottom (a full-width header and
 * footer) are set aside first. In the band between, columns that are one
 * solid colour in both images are gutters, and the band is cut at them.
 */
const strips = (images: Images, pair: RectPair, depth: number): Explanation | null => {
  const { prefix, suffix } = commonEnds(
    hashLines(images.baseline, pair.baseline, "rows"),
    hashLines(images.current, pair.current, "rows"),
  );
  const band: RectPair = {
    baseline: sliceRect(pair.baseline, "rows", prefix, pair.baseline.height - prefix - suffix),
    current: sliceRect(pair.current, "rows", prefix, pair.current.height - prefix - suffix),
  };
  if (isEmptyRect(band.baseline) || isEmptyRect(band.current)) {
    return null;
  }

  const isGutter = Array.from({ length: band.baseline.width }, (_, column) => {
    const color = solidColumnColor(images.baseline, band.baseline, band.baseline.x + column);
    return (
      color !== null &&
      color === solidColumnColor(images.current, band.current, band.current.x + column)
    );
  });
  const columns = stripsBetween(isGutter);
  if (columns.length < 2) {
    return null;
  }

  return combine(
    columns.map(({ start, end }) =>
      explain(
        images,
        {
          baseline: sliceRect(band.baseline, "columns", start, end - start),
          current: sliceRect(band.current, "columns", start, end - start),
        },
        "rows",
        depth + 1,
      ),
    ),
  );
};

/** The cheapest explanation of how `pair.baseline` became `pair.current`. */
export const explain = (images: Images, pair: RectPair, axis: Axis, depth: number): Explanation => {
  const baselineEmpty = isEmptyRect(pair.baseline);
  const currentEmpty = isEmptyRect(pair.current);
  if (baselineEmpty && currentEmpty) {
    return NOTHING;
  }
  if (baselineEmpty) {
    return inserted(images, pair);
  }
  if (currentEmpty) {
    return deleted(images, pair);
  }

  const sameWidth = pair.baseline.width === pair.current.width;
  const sameHeight = pair.baseline.height === pair.current.height;
  const direct = sameWidth && sameHeight ? inPlace(images, pair) : null;
  if (direct?.cost === 0) {
    return direct;
  }

  const canRecurse = depth <= MAX_DEPTH;
  const candidates = [
    direct,
    canRecurse
      ? (aligned(images, pair, axis, depth) ?? aligned(images, pair, otherAxis(axis), depth))
      : null,
    sameWidth && depth < MAX_STRIP_DEPTH ? strips(images, pair, depth) : null,
    sameWidth && !sameHeight ? slid(images, pair, "rows") : null,
    sameHeight && !sameWidth ? slid(images, pair, "columns") : null,
  ].filter((candidate) => candidate !== null);

  return candidates.length > 0 ? cheapest(candidates) : mismatched(images, pair);
};
