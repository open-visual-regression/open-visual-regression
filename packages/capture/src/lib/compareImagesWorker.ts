import pixelmatch from "pixelmatch";
import sharp from "sharp";

import type { DiffHighlight } from "@ovr/api/contracts/settings";
import { alignedDiff, diffInPlace, type AlignedDiff } from "@ovr/diff-analysis/alignedDiff";
import { padToCanvas, PIXELMATCH_THRESHOLD, type RgbaImage } from "@ovr/diff-analysis/image";
import { paintDiff, renderDiff } from "@ovr/diff-analysis/renderDiff";

export type CompareImagesTask = {
  capture: Uint8Array;
  baseline: Uint8Array;
  withDiffImage: boolean;
  diffHighlight: DiffHighlight;
};

export type CompareImagesResult = {
  pixelDiffCount: number;
  diffPercent: number;
  /** Overlay for the new image, tinting what was added or changed. */
  diffImage: Uint8Array | null;
  /** Overlay for the baseline, tinting what was removed or changed. */
  baselineDiffImage: Uint8Array | null;
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

/** Counts the pixels that differ in place, without drawing anything. */
const countChangedPixels = (
  baseline: RgbaImage,
  capture: RgbaImage,
  width: number,
  height: number,
) =>
  pixelmatch(
    padToCanvas(baseline, width, height).data,
    padToCanvas(capture, width, height).data,
    undefined,
    width,
    height,
    { threshold: PIXELMATCH_THRESHOLD },
  );

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

  const diffPercent = (count: number) => (count / (width * height)) * 100;

  if (!withDiffImage) {
    const count = countChangedPixels(baselineImage, captureImage, width, height);
    return {
      pixelDiffCount: count,
      diffPercent: diffPercent(count),
      diffImage: null,
      baselineDiffImage: null,
    };
  }

  // Pass or fail always uses the plain pixel count.
  const diff: AlignedDiff =
    diffHighlight === "smart"
      ? alignedDiff(baselineImage, captureImage)
      : diffInPlace(baselineImage, captureImage);
  const count = diff.plainChangedPixelCount;
  const draw = diffHighlight === "smart" ? renderDiff : paintDiff;
  const [diffImage, baselineDiffImage] =
    count > 0
      ? await Promise.all([
          encodePng(draw(diff.current, "added")),
          encodePng(draw(diff.baseline, "removed")),
        ])
      : [null, null];

  return { pixelDiffCount: count, diffPercent: diffPercent(count), diffImage, baselineDiffImage };
};

export default compareImages;
