import pixelmatch from "pixelmatch";
import sharp from "sharp";

import type { DiffHighlight } from "@ovr/api/contracts/settings";
import { alignedDiff } from "@ovr/diff-analysis/alignedDiff";
import { padToCanvas, PIXELMATCH_THRESHOLD, type RgbaImage } from "@ovr/diff-analysis/image";
import { renderDiff } from "@ovr/diff-analysis/renderDiff";

export type CompareImagesTask = {
  capture: Uint8Array;
  baseline: Uint8Array;
  withDiffImage: boolean;
  diffHighlight: DiffHighlight;
};

export type CompareImagesResult = {
  pixelDiffCount: number;
  diffPercent: number;
  diffImage: Uint8Array | null;
};

sharp.cache(false);

const decodePng = async (image: Uint8Array): Promise<RgbaImage> => {
  const { data, info } = await sharp(image)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
};

const encodePng = ({ data, width, height }: RgbaImage): Promise<Buffer> =>
  sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();

/** Compares the two images pixel by pixel, drawing changed pixels red in `mask`. */
const pixelDiff = (baseline: RgbaImage, capture: RgbaImage, width: number, height: number) => {
  const mask = new Uint8Array(width * height * 4);
  const count = pixelmatch(
    padToCanvas(baseline, width, height).data,
    padToCanvas(capture, width, height).data,
    mask,
    width,
    height,
    { threshold: PIXELMATCH_THRESHOLD, diffMask: true },
  );
  return { count, mask: { width, height, data: mask } };
};

const toCompareResult = (
  count: number,
  width: number,
  height: number,
  diffImage: Uint8Array | null,
): CompareImagesResult => ({
  pixelDiffCount: count,
  diffPercent: (count / (width * height)) * 100,
  diffImage,
});

const compareImages = async ({
  capture,
  baseline,
  withDiffImage,
  diffHighlight,
}: CompareImagesTask): Promise<CompareImagesResult> => {
  const [captureImage, baselineImage] = await Promise.all([
    decodePng(capture),
    decodePng(baseline),
  ]);
  const width = Math.max(captureImage.width, baselineImage.width);
  const height = Math.max(captureImage.height, baselineImage.height);

  if (!withDiffImage) {
    const { count } = pixelDiff(baselineImage, captureImage, width, height);
    return toCompareResult(count, width, height, null);
  }
  if (diffHighlight === "exact") {
    const { count, mask } = pixelDiff(baselineImage, captureImage, width, height);
    return toCompareResult(count, width, height, count > 0 ? await encodePng(mask) : null);
  }

  // Pass or fail still uses the plain pixel count.
  const diff = alignedDiff(baselineImage, captureImage);
  const count = diff.plainChangedPixelCount;
  return toCompareResult(
    count,
    width,
    height,
    count > 0 ? await encodePng(renderDiff(diff)) : null,
  );
};

export default compareImages;
