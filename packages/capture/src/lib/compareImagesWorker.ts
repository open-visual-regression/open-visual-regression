import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import { alignedDiff, type AlignedDiff } from "@ovr/image-diff/alignedDiff";
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

type PlainDiff = { count: number; mask: Uint8Array; width: number; height: number };

/** A position-by-position pixelmatch, padding the smaller image to the larger one's size. */
const plainDiff = (baseline: PNG, capture: PNG): PlainDiff => {
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

/**
 * The diff image reviewers see, drawn over the captured screenshot, so content
 * that only moved down or sideways isn't painted red. When nothing but blank
 * space moved, the aligned diff has nothing to show, so the plain mask is used.
 */
const drawDiffImage = (diff: AlignedDiff, plain: PlainDiff | null): Buffer => {
  if (plain && diff.regions.length === 0) {
    return encodePng(plain.mask, plain.width, plain.height);
  }
  const overlay = renderDiff(diff);
  return encodePng(overlay.data, overlay.width, overlay.height);
};

const result = (count: number, width: number, height: number, diffImage: Uint8Array | null) => ({
  pixelDiffCount: count,
  diffPercent: (count / (width * height)) * 100,
  diffImage,
});

const compareImages = ({
  capture,
  baseline,
  withDiffImage,
}: CompareImagesTask): CompareImagesResult => {
  const capturePixels = decodePng(capture);
  const baselinePixels = decodePng(baseline);
  const width = Math.max(capturePixels.width, baselinePixels.width);
  const height = Math.max(capturePixels.height, baselinePixels.height);

  if (!withDiffImage) {
    return result(plainDiff(baselinePixels, capturePixels).count, width, height, null);
  }

  // Pass or fail is always decided by the plain pixel count. When nothing
  // moved, the aligned diff is exactly that, so the second pass is skipped.
  const diff = alignedDiff(baselinePixels, capturePixels);
  const plain = diff.shifted ? plainDiff(baselinePixels, capturePixels) : null;
  const count = plain ? plain.count : diff.changedPixelCount;
  return result(count, width, height, count > 0 ? drawDiffImage(diff, plain) : null);
};

export default compareImages;
