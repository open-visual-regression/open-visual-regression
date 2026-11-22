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
  /** Where content was removed, as zero-width or zero-height lines in the current image. */
  removals: Rect[];
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
    removals: [],
    addedSpace: [],
  };
};

const rowsHaveMarks = (mask: Uint8Array, width: number, { y, height }: Rect): boolean => {
  for (let pixel = y * width; pixel < (y + height) * width; pixel++) {
    if (mask[pixel]) {
      return true;
    }
  }
  return false;
};

/** Whether every pixel of an image within a rect has the same color. */
const isBlank = (image: RgbaImage, { x, y, width, height }: Rect): boolean => {
  const words = pixelWords(image);
  const first = words[y * image.width + x];
  for (let row = y; row < y + height; row++) {
    for (let column = x; column < x + width; column++) {
      if (words[row * image.width + column] !== first) {
        return false;
      }
    }
  }
  return true;
};

/** Joins removals that land at nearly the same spot in the current image. */
const joinRemovals = (deletions: RectPair[]): RectPair[] => {
  const groups: (RectPair & { vertical: boolean })[] = [];
  for (const deletion of deletions) {
    const vertical = deletion.current.width === 0;
    const index = groups.findIndex(
      (group) =>
        group.vertical === vertical && rectsAreNear(group.current, deletion.current, REMOVAL_GAP),
    );
    const group = groups[index];
    if (group) {
      groups[index] = {
        vertical,
        current: unionRect(group.current, deletion.current),
        baseline: unionRect(group.baseline, deletion.baseline),
      };
    } else {
      groups.push({ ...deletion, vertical });
    }
  }
  // Each removal stays a line in the current image, along the axis it was found on.
  return groups.map(({ vertical, current, baseline }) => ({
    current: vertical ? { ...current, width: 0 } : { ...current, height: 0 },
    baseline,
  }));
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
      removals: [],
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

  // Removed content whose spot is now empty, like a link gone from the end of
  // a row, is marked where it was rather than drawn as a line, as long as a
  // plain comparison also sees a change there.
  const baselineWords = pixelWords(baseline);
  const currentWords = pixelWords(current);
  const removedLines: Rect[] = [];
  for (const { current: line, baseline: removed } of joinRemovals(deletions)) {
    const spot = {
      x: line.x,
      y: line.y,
      width: Math.min(removed.width, width - line.x),
      height: Math.min(removed.height, height - line.y),
    };
    if (spot.width <= 0 || spot.height <= 0 || !isBlank(current, spot)) {
      removedLines.push(line);
      continue;
    }
    const blank = currentWords[spot.y * width + spot.x];
    for (let dy = 0; dy < spot.height; dy++) {
      for (let dx = 0; dx < spot.width; dx++) {
        const pixel = (spot.y + dy) * width + spot.x + dx;
        const removedPixel = baselineWords[(removed.y + dy) * baseline.width + removed.x + dx];
        if (removedPixel !== blank && plain.mask[pixel] && !mask[pixel]) {
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

  // Content removed from within a line that also changed is already marked by
  // that change, so a separate removal line there only adds noise.
  const removals = removedLines.filter(
    (line) => line.width > 0 || !rowsHaveMarks(mask, width, line),
  );

  // The plain comparison failed but every difference was blank space that
  // grew, so that space is shown rather than nothing.
  const onlySpaceGrew = count === 0 && removals.length === 0 && plain.count > 0;
  if (onlySpaceGrew && insertions.length === 0) {
    return diffInPlace(baseline, current);
  }

  return {
    width,
    height,
    changedPixelCount: count,
    plainChangedPixelCount: plain.count,
    mask,
    removals,
    addedSpace: onlySpaceGrew ? insertions : [],
  };
};
