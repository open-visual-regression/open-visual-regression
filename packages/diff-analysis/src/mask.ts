import type { Rect } from "./types";

/** How many pixels of a one-byte-per-pixel mask are set within a rect, clipped to the image. */
export const countIn = (mask: Uint8Array, width: number, height: number, rect: Rect): number => {
  let total = 0;
  const right = Math.min(rect.x + rect.width, width);
  const bottom = Math.min(rect.y + rect.height, height);
  for (let y = Math.max(rect.y, 0); y < bottom; y++) {
    for (let x = Math.max(rect.x, 0); x < right; x++) {
      total += mask[y * width + x] ?? 0;
    }
  }
  return total;
};

/** Whether any pixel of a one-byte-per-pixel mask is set within a rect, clipped to the image. */
export const hasMarks = (mask: Uint8Array, width: number, height: number, rect: Rect): boolean => {
  const right = Math.min(rect.x + rect.width, width);
  const bottom = Math.min(rect.y + rect.height, height);
  for (let y = Math.max(rect.y, 0); y < bottom; y++) {
    for (let x = Math.max(rect.x, 0); x < right; x++) {
      if (mask[y * width + x]) {
        return true;
      }
    }
  }
  return false;
};

/**
 * The pixels a diff highlights, built up step by step. Only pixels a plain
 * position-by-position comparison sees as changed are ever highlighted.
 */
export type Highlights = {
  width: number;
  height: number;
  /** Pixels the plain comparison sees as changed. */
  plain: Uint8Array;
  /** Pixels highlighted so far. */
  mask: Uint8Array;
  count: number;
};

/**
 * Highlights the pixels within a rect that the plain comparison sees as
 * changed, and that `include` accepts given their offset into the rect.
 * Returns how many were newly highlighted.
 */
export const highlightChangesIn = (
  highlights: Highlights,
  rect: Rect,
  include: (pixel: number, dx: number, dy: number) => boolean = () => true,
): number => {
  const { width, height, plain, mask } = highlights;
  let added = 0;
  const right = Math.min(rect.x + rect.width, width);
  const bottom = Math.min(rect.y + rect.height, height);
  for (let y = Math.max(rect.y, 0); y < bottom; y++) {
    for (let x = Math.max(rect.x, 0); x < right; x++) {
      const pixel = y * width + x;
      if (plain[pixel] && !mask[pixel] && include(pixel, x - rect.x, y - rect.y)) {
        mask[pixel] = 1;
        added++;
      }
    }
  }
  highlights.count += added;
  return added;
};
