import type { AlignedDiff } from "./alignedDiff";
import type { Image, Rect } from "./types";

type Rgba = [number, number, number, number];

const CHANGED: Rgba = [255, 0, 0, 255];
const INSERTED: Rgba = [60, 200, 90, 90];
const DELETED: Rgba = [220, 0, 220, 255];

/**
 * Draws a diff as a transparent overlay for the current image: changed pixels
 * in red, inserted regions washed green, and a magenta line where content was
 * removed. Everything else is left transparent, so the screenshot shows through.
 */
export const renderDiff = (diff: AlignedDiff): Image => {
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

  for (const region of diff.regions.filter((region) => region.kind === "inserted")) {
    paintRect(region.current, INSERTED);
  }
  for (let pixel = 0; pixel < diff.mask.length; pixel++) {
    if (diff.mask[pixel]) {
      data.set(CHANGED, pixel * 4);
    }
  }
  // Removed content has no area in the current image, so it's drawn as a 3px line.
  for (const { current: line } of diff.regions.filter((region) => region.kind === "deleted")) {
    paintRect(
      line.height === 0
        ? { x: line.x, y: line.y - 1, width: Math.max(line.width, 1), height: 3 }
        : { x: line.x - 1, y: line.y, width: 3, height: Math.max(line.height, 1) },
      DELETED,
    );
  }

  return { width, height, data };
};
