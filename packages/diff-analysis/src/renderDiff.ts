import type { AlignedDiff } from "./alignedDiff";
import type { RgbaImage } from "./image";
import type { Rect } from "./types";

type Rgba = [number, number, number, number];

const CHANGED: Rgba = [255, 0, 0, 255];
// Space that only grew has no changed pixels to mark, so it's tinted instead.
const ADDED_SPACE: Rgba = [255, 0, 0, 90];
const REMOVAL_LINE_WIDTH = 3;

/**
 * Draws a diff as a transparent overlay for the current image: changed pixels
 * in red, and a red line where content was removed.
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
  // Removed content has no area in the current image, so it's drawn as a line centered on it.
  const half = Math.floor(REMOVAL_LINE_WIDTH / 2);
  for (const line of diff.removals) {
    paintRect(
      line.height === 0
        ? {
            x: line.x,
            y: line.y - half,
            width: Math.max(line.width, 1),
            height: REMOVAL_LINE_WIDTH,
          }
        : {
            x: line.x - half,
            y: line.y,
            width: REMOVAL_LINE_WIDTH,
            height: Math.max(line.height, 1),
          },
      CHANGED,
    );
  }

  return { width, height, data };
};
