import pixelmatch from "pixelmatch";

import { alignImages } from "./align";
import { padToCanvas, PIXELMATCH_THRESHOLD, type RgbaImage } from "./image";
import { pixelWords } from "./pixels";
import { rectsAreNear, unionRect } from "./rect";
import type { Rect, RectPair } from "./types";

export type AlignedDiff = {
  width: number;
  height: number;
  /** Pixels of the current image that changed, not counting content that only moved. */
  changedPixelCount: number;
  /** Pixels a plain position-by-position pixelmatch counts as changed. */
  plainChangedPixelCount: number;
  /** One byte per pixel of the current image: 1 where it changed. */
  mask: Uint8Array;
  /** Blank space that grew, set only when that's the only difference. */
  addedSpace: Rect[];
};

// Removals this close together in the current image are one removal split up
// by the blank gaps between its words, which line up on their own.
const REMOVAL_GAP = 8;

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
    addedSpace: [],
  };
};

/** Joins removals that land at nearly the same spot in the current image. */
const joinRemovals = (deletions: RectPair[]): RectPair[] => {
  const joined: RectPair[] = [];
  for (const deletion of deletions) {
    const index = joined.findIndex((other) =>
      rectsAreNear(other.current, deletion.current, REMOVAL_GAP),
    );
    const other = joined[index];
    if (other) {
      joined[index] = {
        current: unionRect(other.current, deletion.current),
        baseline: unionRect(other.baseline, deletion.baseline),
      };
    } else {
      joined.push(deletion);
    }
  }
  return joined;
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
  const { aligned, insertions, deletions, shifted } = alignImages(baseline, current);
  const lined = pixelmatchMask(aligned, current.data, width, height);

  if (!shifted) {
    return {
      width,
      height,
      changedPixelCount: lined.count,
      plainChangedPixelCount: lined.count,
      mask: lined.mask,
      addedSpace: [],
    };
  }

  // A pixel that looks the same at the same spot in both images hasn't visibly
  // changed, however the alignment paired it up, so it only counts as changed
  // when the plain comparison agrees.
  const plain = diffPixels(baseline, current);
  const mask = new Uint8Array(lined.mask.length);
  let count = 0;
  for (let pixel = 0; pixel < mask.length; pixel++) {
    if (lined.mask[pixel] && plain.mask[pixel]) {
      mask[pixel] = 1;
      count++;
    }
  }

  // Removed content has no place in the current image, so where it was is
  // highlighted instead: each pixel where it differs from what's there now, as
  // long as a plain comparison also sees a change there.
  const baselineWords = pixelWords(baseline);
  const currentWords = pixelWords(current);
  for (const { current: line, baseline: removed } of joinRemovals(deletions)) {
    const spotWidth = Math.min(removed.width, width - line.x);
    const spotHeight = Math.min(removed.height, height - line.y);
    for (let dy = 0; dy < spotHeight; dy++) {
      for (let dx = 0; dx < spotWidth; dx++) {
        const pixel = (line.y + dy) * width + line.x + dx;
        const removedPixel = baselineWords[(removed.y + dy) * baseline.width + removed.x + dx];
        if (removedPixel !== currentWords[pixel] && plain.mask[pixel] && !mask[pixel]) {
          mask[pixel] = 1;
          count++;
        }
      }
    }
  }

  // When both found changes but no pixel in common, neither explanation holds
  // up on its own, so the plain comparison is shown as it is.
  if (count === 0 && lined.count > 0) {
    return diffInPlace(baseline, current);
  }

  // The plain comparison failed but every difference was blank space that
  // grew, so that space is shown rather than nothing.
  const onlySpaceGrew = count === 0 && plain.count > 0;
  if (onlySpaceGrew && insertions.length === 0) {
    return diffInPlace(baseline, current);
  }

  return {
    width,
    height,
    changedPixelCount: count,
    plainChangedPixelCount: plain.count,
    mask,
    addedSpace: onlySpaceGrew ? insertions : [],
  };
};
