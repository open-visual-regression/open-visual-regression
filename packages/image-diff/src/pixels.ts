import { lineCount, lineLength } from "./rect";
import type { Axis, Image, Rect } from "./types";

// Low-level pixel access. These run once per pixel, so they use plain loops
// over typed arrays. Each function only mutates buffers it allocates itself.
//
// Pixels are read as one 32-bit word each (RGBA, in platform byte order),
// which is a single read instead of four. Indexed reads are typed
// `number | undefined` under noUncheckedIndexedAccess; every loop here stays
// in bounds, so the `?? 0` fallbacks never apply.

const wordViews = new WeakMap<Uint8Array, Uint32Array>();

/** An image's pixels as 32-bit words, one per pixel. Cached per image. */
export const pixelWords = (image: Image): Uint32Array => {
  const cached = wordViews.get(image.data);
  if (cached) {
    return cached;
  }
  const { data } = image;
  // A Uint32Array view needs 4-byte alignment; copy the rare buffer that isn't.
  const words =
    data.byteOffset % 4 === 0
      ? new Uint32Array(data.buffer, data.byteOffset, data.length / 4)
      : new Uint32Array(data.slice().buffer);
  wordViews.set(data, words);
  return words;
};

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * One hash per line of a rect along an axis. Two independent 32-bit hashes
 * are combined into one number, so distinct lines practically never collide.
 */
export const hashLines = (image: Image, rect: Rect, axis: Axis): Float64Array => {
  const words = pixelWords(image);
  const hashes = new Float64Array(lineCount(rect, axis));
  const length = lineLength(rect, axis);
  // Step through the image one pixel along the line at a time.
  const stride = axis === "rows" ? 1 : image.width;
  for (let line = 0; line < hashes.length; line++) {
    const start =
      axis === "rows"
        ? (rect.y + line) * image.width + rect.x
        : rect.y * image.width + rect.x + line;
    let fnv = FNV_OFFSET;
    let polynomial = 0;
    for (let step = 0, index = start; step < length; step++, index += stride) {
      const pixel = words[index] ?? 0;
      fnv = Math.imul(fnv ^ pixel, FNV_PRIME) >>> 0;
      polynomial = (Math.imul(polynomial, 31) + pixel) >>> 0;
    }
    hashes[line] = fnv * 0x100000 + (polynomial & 0xfffff);
  }
  return hashes;
};

/** The colour of column `x` within a rect when it is one solid colour, else null. */
export const solidColumnColor = (image: Image, rect: Rect, x: number): number | null => {
  const words = pixelWords(image);
  const color = words[rect.y * image.width + x] ?? 0;
  for (let row = 1; row < rect.height; row++) {
    if ((words[(rect.y + row) * image.width + x] ?? 0) !== color) {
      return null;
    }
  }
  return color;
};
