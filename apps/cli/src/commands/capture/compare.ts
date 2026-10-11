import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const PIXELMATCH_THRESHOLD = 0.1;

const padToCanvas = (image: PNG, width: number, height: number): Uint8Array => {
  if (image.width === width && image.height === height) {
    return image.data;
  }

  const padded = new Uint8Array(width * height * 4);
  for (let y = 0; y < image.height; y++) {
    const rowStart = y * image.width * 4;
    padded.set(image.data.subarray(rowStart, rowStart + image.width * 4), y * width * 4);
  }
  return padded;
};

export const getDiffPercent = (baseline: Buffer, current: Buffer): number => {
  const baselineImage = PNG.sync.read(baseline);
  const currentImage = PNG.sync.read(current);
  const width = Math.max(baselineImage.width, currentImage.width);
  const height = Math.max(baselineImage.height, currentImage.height);

  const changedPixels = pixelmatch(
    padToCanvas(baselineImage, width, height),
    padToCanvas(currentImage, width, height),
    undefined,
    width,
    height,
    { threshold: PIXELMATCH_THRESHOLD },
  );

  return (changedPixels / (width * height)) * 100;
};
