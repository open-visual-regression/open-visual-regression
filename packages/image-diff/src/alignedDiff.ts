import pixelmatch from "pixelmatch";

import { alignImages } from "./align";
import { clustersOf } from "./clusters";
import { mergeRegions } from "./regions";
import type { Image, Rect, Region } from "./types";

/** pixelmatch's colour threshold; the same value the rest of OVR compares with. */
export const PIXEL_THRESHOLD = 0.1;

export type AlignedDiff = {
  width: number;
  height: number;
  /** Pixels of the current image that changed, not counting content that only moved. */
  changedPixelCount: number;
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
    mask,
    regions: mergeRegions(regions),
    shifted: false,
  };
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
  const { mask, outsideInsertions, count } = masksFromOutput(output, inserted);

  // Changes outside inserted content are grouped by where they sit.
  const modified = clustersOf(outsideInsertions, inserted, width, height).map(
    ({ bounds }): Region => ({
      kind: "modified",
      current: bounds,
      baseline: bounds,
    }),
  );
  // Each insertion is one region, trimmed to the pixels in it that differ.
  const added = insertions.flatMap((rect): Region[] => {
    const bounds = maskBounds(mask, width, rect);
    return bounds
      ? [
          {
            kind: "inserted",
            current: bounds,
            baseline: { ...bounds, height: 0 },
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

  return {
    width,
    height,
    changedPixelCount: count,
    mask,
    regions: mergeRegions([...modified, ...added, ...removals]),
    shifted,
  };
};
