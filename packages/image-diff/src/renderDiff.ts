import type { AlignedDiff } from "./alignedDiff";
import type { Image, Rect } from "./types";

type Rgb = [number, number, number];

const CHANGED: Rgb = [230, 30, 30];
const INSERTED: Rgb = [60, 200, 90];
const DELETED: Rgb = [220, 0, 220];

/**
 * Draws a diff over a faded copy of the current image: changed pixels in red,
 * inserted regions tinted green, and a magenta line where content was deleted.
 */
export const renderDiff = (current: Image, diff: AlignedDiff): Image => {
  const { width, height } = current;
  const data = new Uint8Array(width * height * 4);

  const mix = (index: number, value: number, amount: number) => {
    data[index] = (data[index] ?? 0) * (1 - amount) + value * amount;
  };
  const blend = (pixel: number, [red, green, blue]: Rgb, amount: number) => {
    mix(pixel * 4, red, amount);
    mix(pixel * 4 + 1, green, amount);
    mix(pixel * 4 + 2, blue, amount);
  };
  const blendRect = (rect: Rect, color: Rgb, amount: number) => {
    for (let row = Math.max(0, rect.y); row < Math.min(height, rect.y + rect.height); row++) {
      for (
        let column = Math.max(0, rect.x);
        column < Math.min(width, rect.x + rect.width);
        column++
      ) {
        blend(row * width + column, color, amount);
      }
    }
  };

  for (let pixel = 0; pixel < width * height; pixel++) {
    const source = pixel * 4;
    const gray =
      0.299 * (current.data[source] ?? 0) +
      0.587 * (current.data[source + 1] ?? 0) +
      0.114 * (current.data[source + 2] ?? 0);
    const faded = 255 - (255 - gray) * 0.25;
    data.set([faded, faded, faded, 255], source);
  }

  for (const region of diff.regions.filter((region) => region.kind === "inserted")) {
    blendRect(region.current, INSERTED, 0.35);
  }
  for (let pixel = 0; pixel < diff.mask.length; pixel++) {
    if (diff.mask[pixel]) {
      blend(pixel, CHANGED, 0.85);
    }
  }
  // Deletions have no area in the current image, so they're drawn as a 3px line.
  for (const { current: line } of diff.regions.filter((region) => region.kind === "deleted")) {
    blendRect(
      line.height === 0
        ? { x: line.x, y: line.y - 1, width: Math.max(line.width, 1), height: 3 }
        : { x: line.x - 1, y: line.y, width: 3, height: Math.max(line.height, 1) },
      DELETED,
      1,
    );
  }

  return { width, height, data };
};
