import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import { alignedDiff } from "@ovr/image-diff/alignedDiff";
import { renderDiff } from "@ovr/image-diff/renderDiff";

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

const decodePng = (image: Uint8Array): PNG =>
  PNG.sync.read(Buffer.from(image.buffer, image.byteOffset, image.byteLength));

const padToCanvas = (pixels: PNG, width: number, height: number): Uint8Array => {
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

const encodePng = (pixels: Uint8Array, width: number, height: number): Buffer => {
  const png = new PNG({ width, height });
  png.data = Buffer.from(pixels);
  return PNG.sync.write(png);
};

/**
 * The diff image reviewers see, drawn over the captured screenshot. It comes
 * from an aligned diff, so content that only moved down or sideways isn't
 * painted red. When nothing but blank space moved, the aligned diff has
 * nothing to show, so the plain pixel mask is used instead.
 */
const diffOverlay = (
  baseline: PNG,
  capture: PNG,
  plainMask: Uint8Array,
  plainSize: { width: number; height: number },
): Buffer => {
  const diff = alignedDiff(baseline, capture);
  if (diff.regions.length === 0) {
    return encodePng(plainMask, plainSize.width, plainSize.height);
  }
  const overlay = renderDiff(diff);
  return encodePng(overlay.data, overlay.width, overlay.height);
};

const compareImages = ({
  capture,
  baseline,
  withDiffImage,
}: CompareImagesTask): CompareImagesResult => {
  const capturePixels = decodePng(capture);
  const baselinePixels = decodePng(baseline);

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
      withDiffImage && pixelDiffCount > 0
        ? diffOverlay(baselinePixels, capturePixels, diffPixels, { width, height })
        : null,
  };
};

export default compareImages;
