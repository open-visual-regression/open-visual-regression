import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import { padToCanvas, PIXELMATCH_THRESHOLD } from "@ovr/diff-analysis/image";

export const getDiffPercent = (baseline: Buffer, current: Buffer): number => {
  const baselineImage = PNG.sync.read(baseline);
  const currentImage = PNG.sync.read(current);
  const width = Math.max(baselineImage.width, currentImage.width);
  const height = Math.max(baselineImage.height, currentImage.height);

  const changedPixels = pixelmatch(
    padToCanvas(baselineImage, width, height).data,
    padToCanvas(currentImage, width, height).data,
    undefined,
    width,
    height,
    { threshold: PIXELMATCH_THRESHOLD },
  );

  return (changedPixels / (width * height)) * 100;
};
