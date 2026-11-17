import { explain } from "./explain";
import { paintMasks } from "./masks";
import { mergeRegions } from "./regions";
import type { Image, Region } from "./types";

export type AlignedDiff = {
  width: number;
  height: number;
  /** Pixels of the current image that changed, not counting content that only moved. */
  changedPixelCount: number;
  /** One byte per pixel of the current image: 1 where it changed. */
  mask: Uint8Array;
  /** Each visual change, merged with its close neighbours, top to bottom. */
  regions: Region[];
};

/**
 * Diffs two screenshots after lining them up, so content pushed down by a
 * new banner, or sideways by a wider sidebar, is not reported as changed.
 * Coordinates are in the current image.
 */
export const alignedDiff = (baseline: Image, current: Image): AlignedDiff => {
  const explanation = explain(
    { baseline, current },
    {
      baseline: { x: 0, y: 0, width: baseline.width, height: baseline.height },
      current: { x: 0, y: 0, width: current.width, height: current.height },
    },
    "rows",
    0,
  );
  const mask = paintMasks(explanation.masks, current.width, current.height);
  let changedPixelCount = 0;
  for (const bit of mask) {
    changedPixelCount += bit;
  }

  return {
    width: current.width,
    height: current.height,
    changedPixelCount,
    mask,
    regions: mergeRegions(explanation.regions),
  };
};
