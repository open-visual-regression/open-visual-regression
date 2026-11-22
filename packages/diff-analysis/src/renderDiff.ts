import type { AlignedDiff } from "./alignedDiff";
import type { RgbaImage } from "./image";
import type { Rect } from "./types";

type Rgba = [number, number, number, number];

const CHANGED: Rgba = [255, 0, 0, 255];
// Space that only grew has no changed pixels to mark, so it's tinted instead.
const ADDED_SPACE: Rgba = [255, 0, 0, 90];

/**
 * Draws a diff as a transparent overlay for the current image, with changed
 * pixels in red.
 */
export const renderDiff = (diff: AlignedDiff): RgbaImage => {
  const { width, height } = diff;
  const data = new Uint8Array(width * height * 4);

  const paintRect = (rect: Rect, color: Rgba) => {
    for (let row = Math.max(0, rect.y); row < Math.min(height, rect.y + rect.height); row++) {
      for (
        let column = Math.max(0, rect.x);
        column < Math.min(width, rect.x + rect.width);
        column++
      ) {
        data.set(color, (row * width + column) * 4);
      }
    }
  };

  for (const rect of diff.addedSpace) {
    paintRect(rect, ADDED_SPACE);
  }
  for (let pixel = 0; pixel < diff.mask.length; pixel++) {
    if (diff.mask[pixel]) {
      data.set(CHANGED, pixel * 4);
    }
  }
  return { width, height, data };
};
