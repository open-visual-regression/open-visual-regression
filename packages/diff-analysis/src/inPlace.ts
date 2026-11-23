import pixelmatch from "pixelmatch";

import { padToCanvas, PIXELMATCH_THRESHOLD, type RgbaImage } from "./image";
import type { DiffMask, TwoSidedDiff } from "./types";

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

/** Compares two same-size RGBA buffers with pixelmatch, one byte per pixel. */
export const pixelmatchMask = (
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

/** Compares the two images pixel by pixel, top left aligned, on a canvas that fits both. */
export const diffPixels = (baseline: RgbaImage, current: RgbaImage) => {
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

/** The part of a mask on a larger canvas that falls within an image's top left corner. */
const cropMask = (
  mask: Uint8Array,
  canvasWidth: number,
  { width, height }: RgbaImage,
): DiffMask => {
  const cropped = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    cropped.set(mask.subarray(y * canvasWidth, y * canvasWidth + width), y * width);
  }
  return { width, height, mask: cropped };
};

/** Every changed pixel, marked at the same spot on both images. */
export const diffInPlace = (baseline: RgbaImage, current: RgbaImage): TwoSidedDiff => {
  const { mask, count, width } = diffPixels(baseline, current);
  return {
    baseline: cropMask(mask, width, baseline),
    current: cropMask(mask, width, current),
    plainChangedPixelCount: count,
  };
};
