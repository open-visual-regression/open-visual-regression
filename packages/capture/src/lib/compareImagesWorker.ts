import pixelmatch from "pixelmatch";
import sharp from "sharp";

const PIXELMATCH_THRESHOLD = 0.1;

export type CompareImagesTask = {
  capture: Uint8Array;
  baseline: Uint8Array;
  withDiffImage: boolean;
};

export type CompareImagesResult = {
  pixelDiffCount: number;
  diffPercent: number;
  diffImage: Uint8Array | null;
};

type Pixels = { data: Uint8Array; width: number; height: number };

sharp.cache(false);

const decodePng = async (image: Uint8Array): Promise<Pixels> => {
  const { data, info } = await sharp(image)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
};

const padToCanvas = (pixels: Pixels, width: number, height: number): Uint8Array => {
  if (pixels.width === width && pixels.height === height) {
    return pixels.data;
  }

  const padded = new Uint8Array(width * height * 4);
  for (let y = 0; y < pixels.height; y++) {
    const srcStart = y * pixels.width * 4;
    const destStart = y * width * 4;
    padded.set(pixels.data.subarray(srcStart, srcStart + pixels.width * 4), destStart);
  }
  return padded;
};

const encodePng = (pixels: Uint8Array, width: number, height: number): Promise<Buffer> =>
  sharp(pixels, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();

const compareImages = async ({
  capture,
  baseline,
  withDiffImage,
}: CompareImagesTask): Promise<CompareImagesResult> => {
  const [capturePixels, baselinePixels] = await Promise.all([
    decodePng(capture),
    decodePng(baseline),
  ]);

  const width = Math.max(capturePixels.width, baselinePixels.width);
  const height = Math.max(capturePixels.height, baselinePixels.height);
  const diffPixels = new Uint8Array(width * height * 4);

  const pixelDiffCount = pixelmatch(
    padToCanvas(baselinePixels, width, height),
    padToCanvas(capturePixels, width, height),
    diffPixels,
    width,
    height,
    { threshold: PIXELMATCH_THRESHOLD, diffMask: true },
  );

  return {
    pixelDiffCount,
    diffPercent: (pixelDiffCount / (width * height)) * 100,
    diffImage:
      withDiffImage && pixelDiffCount > 0 ? await encodePng(diffPixels, width, height) : null,
  };
};

export default compareImages;
