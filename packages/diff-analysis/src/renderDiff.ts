import type { AlignedDiff } from "./alignedDiff";
import type { RgbaImage } from "./image";

const CHANGED = [255, 0, 0, 255];

/** Draws a diff as a transparent overlay for the current image, with changed pixels in red. */
export const renderDiff = (diff: AlignedDiff): RgbaImage => {
  const { width, height } = diff;
  const data = new Uint8Array(width * height * 4);
  for (let pixel = 0; pixel < diff.mask.length; pixel++) {
    if (diff.mask[pixel]) {
      data.set(CHANGED, pixel * 4);
    }
  }
  return { width, height, data };
};
