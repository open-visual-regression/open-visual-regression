import pixelmatch from "pixelmatch";

import { alignImages } from "./align";
import { clustersOf } from "./clusters";
import { pairMoves } from "./moves";
import { mergeRegions } from "./regions";
import type { Image, Rect, Region } from "./types";

/** pixelmatch's colour threshold; the same value the rest of OVR compares with. */
export const PIXEL_THRESHOLD = 0.1;

export type AlignedDiff = {
  width: number;
  height: number;
  /** Pixels of the current image that changed, not counting content that only moved. */
  changedPixelCount: number;
  /** Pixels a plain position-by-position pixelmatch counts as changed. */
  plainChangedPixelCount: number;
  /** One byte per pixel of the current image: 1 where it changed. */
  mask: Uint8Array;
  /** Each visual change, merged with its close neighbours, top to bottom. */
  regions: Region[];
  /**
   * Whether any content was lined up at a new position. When not, the result
   * is exactly a plain pixelmatch of the two images, padded to the same size.
   */
  shifted: boolean;
};

/**
 * Turns pixelmatch's diff-mask output (changed pixels drawn red) into one byte
 * per pixel, plus a copy without the pixels that sit in inserted content.
 */
const masksFromOutput = (output: Uint8Array, inserted: Uint8Array) => {
  const mask = new Uint8Array(output.length / 4);
  const outsideInsertions = new Uint8Array(mask.length);
  let count = 0;
  for (let pixel = 0; pixel < mask.length; pixel++) {
    if (output[pixel * 4 + 3] !== 0 && output[pixel * 4 + 1] === 0) {
      mask[pixel] = 1;
      outsideInsertions[pixel] = inserted[pixel] ? 0 : 1;
      count++;
    }
  }
  return { mask, outsideInsertions, count };
};

/** The tightest rect around the set pixels of a mask inside `rect`, or null when none are set. */
const maskBounds = (mask: Uint8Array, width: number, rect: Rect): Rect | null => {
  let left = Infinity;
  let top = Infinity;
  let right = -1;
  let bottom = -1;
  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) {
      if (mask[y * width + x]) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  return right < 0 ? null : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
};

/** Pads an image with transparent pixels to `width` × `height`. */
const padTo = (image: Image, width: number, height: number): Uint8Array => {
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

/** Screenshots of different widths can't be lined up, so they're compared in place. */
const diffInPlace = (baseline: Image, current: Image): AlignedDiff => {
  const width = Math.max(baseline.width, current.width);
  const height = Math.max(baseline.height, current.height);
  const output = new Uint8Array(width * height * 4);
  pixelmatch(padTo(baseline, width, height), padTo(current, width, height), output, width, height, {
    threshold: PIXEL_THRESHOLD,
    diffMask: true,
    diffColor: [255, 0, 0],
  });
  const { mask, count } = masksFromOutput(output, new Uint8Array(width * height));
  const regions = clustersOf(mask, new Uint8Array(mask.length), width, height).map(
    ({ bounds }): Region => ({
      kind: "modified",
      current: bounds,
      baseline: bounds,
    }),
  );
  return {
    width,
    height,
    changedPixelCount: count,
    plainChangedPixelCount: count,
    mask,
    regions: mergeRegions(regions),
    shifted: false,
  };
};

/** A plain pixelmatch of the two images, padded to the same size, as one byte per pixel. */
const plainMask = (baseline: Image, current: Image) => {
  const width = Math.max(baseline.width, current.width);
  const height = Math.max(baseline.height, current.height);
  const output = new Uint8Array(width * height * 4);
  pixelmatch(padTo(baseline, width, height), padTo(current, width, height), output, width, height, {
    threshold: PIXEL_THRESHOLD,
    diffMask: true,
    diffColor: [255, 0, 0],
  });
  const { mask, count } = masksFromOutput(output, new Uint8Array(width * height));
  return { mask, count, width };
};

/**
 * Diffs two screenshots after lining them up, so content pushed down by a
 * new banner, or sideways by a wider sidebar, is not reported as changed.
 * Coordinates are in the current image.
 *
 * The baseline is rearranged into the current image's coordinates, then the
 * two are compared with a single pixelmatch pass, so the cost stays close to
 * a plain pixel diff whatever changed.
 */
export const alignedDiff = (baseline: Image, current: Image): AlignedDiff => {
  if (baseline.width !== current.width) {
    return diffInPlace(baseline, current);
  }

  const { width, height } = current;
  const { aligned, inserted, insertions, deletions, shifted } = alignImages(baseline, current);

  const output = new Uint8Array(aligned.length);
  pixelmatch(aligned, current.data, output, width, height, {
    threshold: PIXEL_THRESHOLD,
    diffMask: true,
    diffColor: [255, 0, 0],
  });
  const lined = masksFromOutput(output, inserted);

  const withRegions = (
    mask: Uint8Array,
    outsideInsertions: Uint8Array,
    changed: number,
    plainCount: number,
  ): AlignedDiff => {
    // Changes outside inserted content are grouped by where they sit.
    const modified = clustersOf(outsideInsertions, inserted, width, height).map(
      ({ bounds }): Region => ({ kind: "modified", current: bounds, baseline: bounds }),
    );
    // Each insertion is one region, trimmed to the pixels in it that differ.
    // Its content is the part that differs from the lines it was filled with.
    const added = insertions.flatMap((rect) => {
      const bounds = maskBounds(mask, width, rect);
      const content = maskBounds(lined.mask, width, rect);
      return bounds && content
        ? [
            {
              region: {
                kind: "inserted",
                current: bounds,
                baseline: { ...bounds, height: 0 },
              } as Region,
              content,
            },
          ]
        : [];
    });
    const removals = deletions.map(
      ({ current: line, baseline: rect }): Region => ({
        kind: "deleted",
        current: line,
        baseline: rect,
      }),
    );
    const moves = pairMoves(baseline, current, added, removals);

    // Content that only moved isn't a change, so its pixels leave the mask.
    let count = changed;
    for (const { current: rect } of moves.moved) {
      for (let y = rect.y; y < rect.y + rect.height; y++) {
        for (let x = rect.x; x < rect.x + rect.width; x++) {
          count -= mask[y * width + x] ?? 0;
          mask[y * width + x] = 0;
        }
      }
    }

    let regions = [
      ...mergeRegions([...modified, ...moves.inserted, ...moves.deleted]),
      ...moves.moved,
    ].sort((a, b) => a.current.y - b.current.y || a.current.x - b.current.x);
    // The plain comparison failed but every difference was blank space that
    // grew, so that space is shown as inserted rather than showing nothing.
    if (regions.length === 0 && plainCount > 0) {
      regions = insertions.map(
        (rect): Region => ({
          kind: "inserted",
          current: rect,
          baseline: { ...rect, height: 0 },
        }),
      );
      if (regions.length === 0) {
        return { ...diffInPlace(baseline, current), shifted };
      }
    }

    return {
      width,
      height,
      changedPixelCount: count,
      plainChangedPixelCount: plainCount,
      mask,
      regions,
      shifted,
    };
  };
  if (!shifted) {
    return withRegions(lined.mask, lined.outsideInsertions, lined.count, lined.count);
  }

  // A pixel that looks the same at the same spot in both images hasn't visibly
  // changed, however the alignment paired it up, so it only counts as changed
  // when the plain comparison agrees.
  const plain = plainMask(baseline, current);
  const mask = new Uint8Array(lined.mask.length);
  const outsideInsertions = new Uint8Array(lined.mask.length);
  let count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = y * width + x;
      if (lined.mask[pixel] && plain.mask[y * plain.width + x]) {
        mask[pixel] = 1;
        outsideInsertions[pixel] = inserted[pixel] ? 0 : 1;
        count++;
      }
    }
  }
  // When both found changes but no pixel in common, neither explanation holds
  // up on its own, so the plain comparison is shown as it is.
  if (count === 0 && lined.count > 0) {
    return { ...diffInPlace(baseline, current), shifted };
  }
  return withRegions(mask, outsideInsertions, count, plain.count);
};
