import pixelmatch from "pixelmatch";

import { alignImages } from "./align";
import { clustersOf } from "./clusters";
import { padToCanvas, PIXELMATCH_THRESHOLD, type RgbaImage } from "./image";
import { mergeRegions } from "./regions";
import type { Rect, Region } from "./types";

export type AlignedDiff = {
  width: number;
  height: number;
  /** Pixels of the current image that changed, not counting content that only moved. */
  changedPixelCount: number;
  /** Pixels a plain position-by-position pixelmatch counts as changed. */
  plainChangedPixelCount: number;
  /** One byte per pixel of the current image: 1 where it changed. */
  mask: Uint8Array;
  /** Each visual change, merged with its close neighbors, top to bottom. */
  regions: Region[];
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

const rowsHaveMarks = (mask: Uint8Array, width: number, { y, height }: Rect): boolean => {
  for (let pixel = y * width; pixel < (y + height) * width; pixel++) {
    if (mask[pixel]) {
      return true;
    }
  }
  return false;
};

/** Compares the two images pixel by pixel, top left aligned. */
const diffPixels = (baseline: RgbaImage, current: RgbaImage) => {
  const width = Math.max(baseline.width, current.width);
  const height = Math.max(baseline.height, current.height);
  const output = new Uint8Array(width * height * 4);
  pixelmatch(
    padToCanvas(baseline, width, height).data,
    padToCanvas(current, width, height).data,
    output,
    width,
    height,
    { threshold: PIXELMATCH_THRESHOLD, diffMask: true, diffColor: [255, 0, 0] },
  );
  const { mask, count } = masksFromOutput(output, new Uint8Array(width * height));
  return { mask, count, width, height };
};

/** Screenshots of different widths can't be lined up, so they're compared in place. */
const diffInPlace = (baseline: RgbaImage, current: RgbaImage): AlignedDiff => {
  const { mask, count, width, height } = diffPixels(baseline, current);
  const regions = clustersOf(mask, width, height).map(
    (bounds): Region => ({ kind: "changed", current: bounds, baseline: bounds }),
  );
  return {
    width,
    height,
    changedPixelCount: count,
    plainChangedPixelCount: count,
    mask,
    regions: mergeRegions(regions),
  };
};

/**
 * Diffs two screenshots after lining them up, so content pushed down by a
 * new banner, or sideways by a wider sidebar, is not reported as changed.
 * Coordinates are in the current image.
 */
export const alignedDiff = (baseline: RgbaImage, current: RgbaImage): AlignedDiff => {
  if (baseline.width !== current.width) {
    return diffInPlace(baseline, current);
  }

  const { width, height } = current;
  const { aligned, inserted, insertions, deletions, shifted } = alignImages(baseline, current);

  const output = new Uint8Array(aligned.length);
  pixelmatch(aligned, current.data, output, width, height, {
    threshold: PIXELMATCH_THRESHOLD,
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
    const changedRegions = clustersOf(outsideInsertions, width, height).map(
      (bounds): Region => ({ kind: "changed", current: bounds, baseline: bounds }),
    );
    const insertedRegions = insertions.flatMap((rect): Region[] => {
      const bounds = maskBounds(mask, width, rect);
      return bounds
        ? [{ kind: "inserted", current: bounds, baseline: { ...bounds, height: 0 } }]
        : [];
    });
    // Content removed from within a line that also changed is already marked
    // by that change, so a separate removal line there only adds noise.
    const removals = deletions
      .filter(({ current: line }) => line.width > 0 || !rowsHaveMarks(mask, width, line))
      .map(
        ({ current: line, baseline: rect }): Region => ({
          kind: "deleted",
          current: line,
          baseline: rect,
        }),
      );

    let regions = mergeRegions([...changedRegions, ...insertedRegions, ...removals]);
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
        return diffInPlace(baseline, current);
      }
    }

    return {
      width,
      height,
      changedPixelCount: changed,
      plainChangedPixelCount: plainCount,
      mask,
      regions,
    };
  };
  if (!shifted) {
    return withRegions(lined.mask, lined.outsideInsertions, lined.count, lined.count);
  }

  // A pixel that looks the same at the same spot in both images hasn't visibly
  // changed, however the alignment paired it up, so it only counts as changed
  // when the plain comparison agrees.
  const plain = diffPixels(baseline, current);
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
    return diffInPlace(baseline, current);
  }
  return withRegions(mask, outsideInsertions, count, plain.count);
};
