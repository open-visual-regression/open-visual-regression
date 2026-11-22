import type { AlignedDiff } from "./alignedDiff";
import type { RgbaImage } from "./image";
import type { Rect } from "./types";

type Rgba = [number, number, number, number];

const CHANGED: Rgba = [255, 0, 0, 255];
// Space that only grew has no changed pixels to mark, so it's tinted instead.
const ADDED_SPACE: Rgba = [255, 0, 0, 90];
const MOVED: Rgba = [60, 140, 255, 255];
const OUTLINE_WIDTH = 2;
const REMOVED_LINE_WIDTH = 3;

/**
 * Draws a diff as a transparent overlay for the current image: changed pixels
 * in red, a red line where content was removed, and a blue outline around
 * content that moved.
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

  const outline = (rect: Rect, color: Rgba) => {
    const { x, y, width: w, height: h } = rect;
    const edge = OUTLINE_WIDTH;
    paintRect({ x: x - edge, y: y - edge, width: w + edge * 2, height: edge }, color);
    paintRect({ x: x - edge, y: y + h, width: w + edge * 2, height: edge }, color);
    paintRect({ x: x - edge, y, width: edge, height: h }, color);
    paintRect({ x: x + w, y, width: edge, height: h }, color);
  };

  const hasMarkedPixels = ({ x, y, width: w, height: h }: Rect) => {
    for (let row = y; row < y + h; row++) {
      for (let column = x; column < x + w; column++) {
        if (diff.mask[row * width + column]) {
          return true;
        }
      }
    }
    return false;
  };

  for (const { current: rect } of diff.regions.filter((region) => region.kind === "inserted")) {
    if (!hasMarkedPixels(rect)) {
      paintRect(rect, ADDED_SPACE);
    }
  }
  for (let pixel = 0; pixel < diff.mask.length; pixel++) {
    if (diff.mask[pixel]) {
      data.set(CHANGED, pixel * 4);
    }
  }
  for (const { current: rect } of diff.regions.filter((region) => region.kind === "moved")) {
    outline(rect, MOVED);
  }
  // Removed content has no area in the current image, so it's drawn as a line centered on it.
  const half = Math.floor(REMOVED_LINE_WIDTH / 2);
  for (const { current: line } of diff.regions.filter((region) => region.kind === "deleted")) {
    paintRect(
      line.height === 0
        ? {
            x: line.x,
            y: line.y - half,
            width: Math.max(line.width, 1),
            height: REMOVED_LINE_WIDTH,
          }
        : {
            x: line.x - half,
            y: line.y,
            width: REMOVED_LINE_WIDTH,
            height: Math.max(line.height, 1),
          },
      CHANGED,
    );
  }

  return { width, height, data };
};
