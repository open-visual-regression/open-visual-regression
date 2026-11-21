import pixelmatch from "pixelmatch";
import sharp from "sharp";

import type { DiffAlgorithm } from "@ovr/api/contracts/settings";
import { alignedDiff, type AlignedDiff } from "@ovr/image-diff/alignedDiff";
import { renderDiff } from "@ovr/image-diff/renderDiff";

const PIXELMATCH_THRESHOLD = 0.1;

export type CompareImagesTask = {
  capture: Uint8Array;
  baseline: Uint8Array;
  withDiffImage: boolean;
  diffAlgorithm: DiffAlgorithm;
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

type PlainDiff = { count: number; mask: Uint8Array; width: number; height: number };

const plainDiff = (baseline: Pixels, capture: Pixels): PlainDiff => {
  const width = Math.max(capture.width, baseline.width);
  const height = Math.max(capture.height, baseline.height);
  const mask = new Uint8Array(width * height * 4);
  const count = pixelmatch(
    padToCanvas(baseline, width, height),
    padToCanvas(capture, width, height),
    mask,
    width,
    height,
    { threshold: PIXELMATCH_THRESHOLD, diffMask: true },
  );
  return { count, mask, width, height };
};

const drawDiffImage = (diff: AlignedDiff): Promise<Buffer> => {
  const overlay = renderDiff(diff);
  return encodePng(overlay.data, overlay.width, overlay.height);
};

const result = (count: number, width: number, height: number, diffImage: Uint8Array | null) => ({
  pixelDiffCount: count,
  diffPercent: (count / (width * height)) * 100,
  diffImage,
});

const compareImages = async ({
  capture,
  baseline,
  withDiffImage,
  diffAlgorithm,
}: CompareImagesTask): Promise<CompareImagesResult> => {
  const [capturePixels, baselinePixels] = await Promise.all([
    decodePng(capture),
    decodePng(baseline),
  ]);
  const width = Math.max(capturePixels.width, baselinePixels.width);
  const height = Math.max(capturePixels.height, baselinePixels.height);

  if (!withDiffImage) {
    return result(plainDiff(baselinePixels, capturePixels).count, width, height, null);
  }
  if (diffAlgorithm === "exact") {
    const plain = plainDiff(baselinePixels, capturePixels);
    const image = plain.count > 0 ? await encodePng(plain.mask, plain.width, plain.height) : null;
    return result(plain.count, width, height, image);
  }

  // Pass or fail still uses the plain pixel count.
  const diff = alignedDiff(baselinePixels, capturePixels);
  const count = diff.plainChangedPixelCount;
  return result(count, width, height, count > 0 ? await drawDiffImage(diff) : null);
};

export default compareImages;
