import pixelmatch from "pixelmatch";

export type RgbaImage = {
  width: number;
  height: number;
  data: Uint8Array;
};

export type ImageDiff = {
  width: number;
  height: number;
  pixelDiffCount: number;
  diffPercent: number;
  diffPixels: Uint8Array;
};

const CHANNELS_PER_PIXEL = 4;

export const DEFAULT_PIXELMATCH_THRESHOLD = 0.1;

export const padToCanvas = (image: RgbaImage, width: number, height: number): Uint8Array => {
  if (image.width === width && image.height === height) {
    return image.data;
  }

  const padded = new Uint8Array(width * height * CHANNELS_PER_PIXEL);

  for (let y = 0; y < image.height; y++) {
    const srcStart = y * image.width * CHANNELS_PER_PIXEL;
    const destStart = y * width * CHANNELS_PER_PIXEL;
    padded.set(
      image.data.subarray(srcStart, srcStart + image.width * CHANNELS_PER_PIXEL),
      destStart,
    );
  }

  return padded;
};

export const diffImages = (baseline: RgbaImage, capture: RgbaImage): ImageDiff => {
  const width = Math.max(baseline.width, capture.width);
  const height = Math.max(baseline.height, capture.height);

  const baselinePadded = padToCanvas(baseline, width, height);
  const capturePadded = padToCanvas(capture, width, height);
  const diffPixels = new Uint8Array(width * height * CHANNELS_PER_PIXEL);

  const pixelDiffCount = pixelmatch(baselinePadded, capturePadded, diffPixels, width, height, {
    threshold: DEFAULT_PIXELMATCH_THRESHOLD,
    diffMask: true,
  });

  const diffPercent = (pixelDiffCount / (width * height)) * 100;

  return { width, height, pixelDiffCount, diffPercent, diffPixels };
};
