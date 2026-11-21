import type { AlignedDiff } from "./alignedDiff";
import type { Image, Rect } from "./types";

type Rgba = [number, number, number, number];

const CHANGED: Rgba = [255, 0, 0, 255];
const INSERTED: Rgba = [60, 200, 90, 90];
const INSERTED_EDGE: Rgba = [60, 200, 90, 255];
const DELETED: Rgba = [220, 0, 220, 255];
const MOVED: Rgba = [60, 140, 255, 255];

/**
 * Draws a diff as a transparent overlay for the current image: changed pixels
 * in red, inserted regions washed and outlined green, a blue outline around
 * content that moved, and a magenta line where content was removed. Everything
 * else is left transparent, so the screenshot shows through.
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

  /** A 2px frame just outside a rect. */
  const outline = (rect: Rect, color: Rgba) => {
    const { x, y, width: w, height: h } = rect;
    paintRect({ x: x - 2, y: y - 2, width: w + 4, height: 2 }, color);
    paintRect({ x: x - 2, y: y + h, width: w + 4, height: 2 }, color);
    paintRect({ x: x - 2, y, width: 2, height: h }, color);
    paintRect({ x: x + w, y, width: 2, height: h }, color);
  };

  // Inserted content is all new, so it's washed as a block rather than
  // painted pixel by pixel.
  const inserted = new Uint8Array(width * height);
  for (const { current: rect } of diff.regions.filter((region) => region.kind === "inserted")) {
    paintRect(rect, INSERTED);
    outline(rect, INSERTED_EDGE);
    for (let row = Math.max(0, rect.y); row < Math.min(height, rect.y + rect.height); row++) {
      inserted.fill(
        1,
        row * width + Math.max(0, rect.x),
        row * width + Math.min(width, rect.x + rect.width),
      );
    }
  }
  for (let pixel = 0; pixel < diff.mask.length; pixel++) {
    if (diff.mask[pixel] && !inserted[pixel]) {
      data.set(CHANGED, pixel * 4);
    }
  }
  for (const { current: rect } of diff.regions.filter((region) => region.kind === "moved")) {
    outline(rect, MOVED);
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
