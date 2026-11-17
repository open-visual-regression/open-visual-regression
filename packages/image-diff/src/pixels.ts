import { lineCount, lineLength } from "./rect";
import type { Axis, Image, Rect } from "./types";

// Low-level pixel access. These run once per pixel, so they use plain loops
// over typed arrays. Each function only mutates buffers it allocates itself.

/** The pixel at (x, y) packed into one 32-bit number (RGBA, little-endian). */
export const pixelAt = (image: Image, x: number, y: number): number => {
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

/** Copies a rect of an image into its own RGBA buffer. */
export const cropPixels = (image: Image, rect: Rect): Uint8Array => {
  const out = new Uint8Array(rect.width * rect.height * 4);
  for (let row = 0; row < rect.height; row++) {
    const start = ((rect.y + row) * image.width + rect.x) * 4;
    out.set(image.data.subarray(start, start + rect.width * 4), row * rect.width * 4);
  }
  return out;
};

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * One hash per line of a rect along an axis. Two independent 32-bit hashes
 * are combined into one number, so distinct lines practically never collide.
 */
export const hashLines = (image: Image, rect: Rect, axis: Axis): Float64Array => {
  const hashes = new Float64Array(lineCount(rect, axis));
  const length = lineLength(rect, axis);
  for (let line = 0; line < hashes.length; line++) {
    let fnv = FNV_OFFSET;
    let polynomial = 0;
    for (let step = 0; step < length; step++) {
      const pixel =
        axis === "rows"
          ? pixelAt(image, rect.x + step, rect.y + line)
          : pixelAt(image, rect.x + line, rect.y + step);
      fnv = Math.imul(fnv ^ pixel, FNV_PRIME) >>> 0;
      polynomial = (Math.imul(polynomial, 31) + pixel) >>> 0;
    }
    hashes[line] = fnv * 0x100000 + (polynomial & 0xfffff);
  }
  return hashes;
};

/** The colour of column `x` within a rect when it is one solid colour, else null. */
export const solidColumnColor = (image: Image, rect: Rect, x: number): number | null => {
  const color = pixelAt(image, x, rect.y);
  for (let row = 1; row < rect.height; row++) {
    if (pixelAt(image, x, rect.y + row) !== color) {
      return null;
    }
  }
  return color;
};

const MAX_COLOR_SAMPLES = 4096;

/** The most common colour of a rect, from an even sample of its pixels. */
export const dominantColor = (image: Image, rect: Rect): number => {
  const step = Math.max(1, Math.floor(Math.sqrt((rect.width * rect.height) / MAX_COLOR_SAMPLES)));
  const counts = new Map<number, number>();
  for (let row = 0; row < rect.height; row += step) {
    for (let column = 0; column < rect.width; column += step) {
      const pixel = pixelAt(image, rect.x + column, rect.y + row);
      counts.set(pixel, (counts.get(pixel) ?? 0) + 1);
    }
  }
  return [...counts].reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0];
};

/** How many pixels of two same-size rects are not exactly equal. */
export const countUnequalPixels = (
  baseline: Image,
  baselineRect: Rect,
  current: Image,
  currentRect: Rect,
): number => {
  let count = 0;
  for (let row = 0; row < currentRect.height; row++) {
    for (let column = 0; column < currentRect.width; column++) {
      const before = pixelAt(baseline, baselineRect.x + column, baselineRect.y + row);
      const after = pixelAt(current, currentRect.x + column, currentRect.y + row);
      count += before === after ? 0 : 1;
    }
  }
  return count;
};
