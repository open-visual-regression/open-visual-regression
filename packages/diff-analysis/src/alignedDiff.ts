import { alignImages, baselinePixelOf } from "./align";
import { markEdits } from "./edits";
import type { RgbaImage } from "./image";
import { diffInPlace, diffPixels, pixelmatchMask } from "./inPlace";
import type { DiffMask, TwoSidedDiff } from "./types";

// Every distance and size threshold in this package is in screenshot pixels,
// which OVR captures at a device scale factor of 1.

/**
 * Diffs two screenshots after lining them up, so content that only moved, like
 * everything below a new banner or beside a wider sidebar, isn't marked.
 * Content and space the alignment found added are marked on the current image,
 * content and space it found removed on the baseline, and content that changed
 * in place on both, each where it is.
 */
export const alignedDiff = (baseline: RgbaImage, current: RgbaImage): TwoSidedDiff => {
  if (baseline.width !== current.width) {
    return diffInPlace(baseline, current);
  }

  const { width, height } = current;
  const alignment = alignImages(baseline, current);
  if (!alignment.shifted) {
    return diffInPlace(baseline, current);
  }

  const lined = pixelmatchMask(alignment.aligned, current.data, width, height);
  // A pixel that looks the same at the same spot in both images hasn't visibly
  // changed, however the alignment paired it up, so it only counts as changed
  // when the plain comparison agrees.
  const plain = diffPixels(baseline, current);
  const baselineMask: DiffMask = {
    width: baseline.width,
    height: baseline.height,
    mask: new Uint8Array(baseline.width * baseline.height),
  };
  const currentMask: DiffMask = { width, height, mask: new Uint8Array(width * height) };
  // Both images are the same width, so the plain diff's canvas lines up with the current image.
  for (let pixel = 0; pixel < currentMask.mask.length; pixel++) {
    if (lined.mask[pixel] && plain.mask[pixel]) {
      currentMask.mask[pixel] = 1;
      const source = baselinePixelOf(alignment, pixel % width, Math.floor(pixel / width));
      if (source >= 0) {
        baselineMask.mask[source] = 1;
      }
    }
  }
  markEdits(baseline, current, baselineMask, currentMask, alignment);

  // When nothing the alignment found explains a difference, every changed
  // pixel is marked in place, so a failing snapshot always shows something.
  if (plain.count > 0 && !baselineMask.mask.includes(1) && !currentMask.mask.includes(1)) {
    return diffInPlace(baseline, current);
  }

  return { baseline: baselineMask, current: currentMask, plainChangedPixelCount: plain.count };
};
