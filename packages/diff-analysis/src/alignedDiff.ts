import pixelmatch from "pixelmatch";

import { alignImages } from "./align";
import { padToCanvas, PIXELMATCH_THRESHOLD, type RgbaImage } from "./image";
import type { Highlights } from "./mask";
import { highlightRemovals } from "./removals";
import { highlightSpacingChanges } from "./spacing";

// Every distance and size threshold in this package is in screenshot pixels,
// which OVR captures at a device scale factor of 1.

export type AlignedDiff = {
  width: number;
  height: number;
  /** Pixels the diff highlights: what changed, without content that only moved along. */
  changedPixelCount: number;
  /** Pixels a plain position-by-position pixelmatch counts as changed. */
  plainChangedPixelCount: number;
  /** One byte per pixel of the current image: 1 where it's highlighted. */
  mask: Uint8Array;
};

/** Turns pixelmatch's diff-mask output (changed pixels drawn red) into one byte per pixel. */
const maskFromOutput = (output: Uint8Array) => {
  const mask = new Uint8Array(output.length / 4);
  let count = 0;
  for (let pixel = 0; pixel < mask.length; pixel++) {
    if (output[pixel * 4 + 3] !== 0 && output[pixel * 4 + 1] === 0) {
      mask[pixel] = 1;
      count++;
    }
  }
  return { mask, count };
};

const pixelmatchMask = (
  baseline: Uint8Array,
  current: Uint8Array,
  width: number,
  height: number,
) => {
  const output = new Uint8Array(width * height * 4);
  pixelmatch(baseline, current, output, width, height, {
    threshold: PIXELMATCH_THRESHOLD,
    diffMask: true,
    diffColor: [255, 0, 0],
  });
  return maskFromOutput(output);
};

/** Compares the two images pixel by pixel, top left aligned. */
const diffPixels = (baseline: RgbaImage, current: RgbaImage) => {
  const width = Math.max(baseline.width, current.width);
  const height = Math.max(baseline.height, current.height);
  const { mask, count } = pixelmatchMask(
    padToCanvas(baseline, width, height).data,
    padToCanvas(current, width, height).data,
    width,
    height,
  );
  return { mask, count, width, height };
};

/** Screenshots of different widths can't be lined up, so they're compared in place. */
const diffInPlace = (baseline: RgbaImage, current: RgbaImage): AlignedDiff => {
  const { mask, count, width, height } = diffPixels(baseline, current);
  return {
    width,
    height,
    changedPixelCount: count,
    plainChangedPixelCount: count,
    mask,
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
  const alignment = alignImages(baseline, current);
  const lined = pixelmatchMask(alignment.aligned, current.data, width, height);

  if (!alignment.shifted) {
    return {
      width,
      height,
      changedPixelCount: lined.count,
      plainChangedPixelCount: lined.count,
      mask: lined.mask,
    };
  }

  // A pixel that looks the same at the same spot in both images hasn't visibly
  // changed, however the alignment paired it up, so it only counts as changed
  // when the plain comparison agrees.
  const plain = diffPixels(baseline, current);
  const highlights: Highlights = {
    width,
    height,
    plain: plain.mask,
    mask: new Uint8Array(lined.mask.length),
    count: 0,
  };
  for (let pixel = 0; pixel < highlights.mask.length; pixel++) {
    if (lined.mask[pixel] && plain.mask[pixel]) {
      highlights.mask[pixel] = 1;
      highlights.count++;
    }
  }

  const removals = highlightRemovals(highlights, baseline, current, alignment.deletions);
  highlightSpacingChanges(highlights, baseline, current, alignment, removals);

  // When nothing explains the difference, the plain comparison is shown as it is.
  if (highlights.count === 0 && plain.count > 0) {
    return diffInPlace(baseline, current);
  }

  return {
    width,
    height,
    changedPixelCount: highlights.count,
    plainChangedPixelCount: plain.count,
    mask: highlights.mask,
  };
};
