import { Piscina } from "piscina";

import type { CompareImagesResult, CompareImagesTask } from "./compareImagesWorker";
import { readImage } from "./imageCache";

// The worker app bundles this module into dist/index.js, next to dist/compareImagesWorker.js.
const COMPARE_WORKER_URL = new URL(
  import.meta.url.endsWith(".ts") ? "./compareImagesWorker.ts" : "./compareImagesWorker.js",
  import.meta.url,
);

let comparisons: Piscina<CompareImagesTask, CompareImagesResult> | undefined;

const getComparisons = (): Piscina<CompareImagesTask, CompareImagesResult> => {
  comparisons ??= new Piscina({
    filename: COMPARE_WORKER_URL.href,
    minThreads: 1,
    maxThreads: 1,
  });
  return comparisons;
};

type ImageComparison = {
  pixelDiffCount: number;
  diffPercent: number;
  diffImage: Buffer | null;
};

export const compareImages = async (
  capturePath: string,
  baselinePath: string,
  { withDiffImage = false }: { withDiffImage?: boolean } = {},
): Promise<ImageComparison> => {
  const [capture, baseline] = await Promise.all([readImage(capturePath), readImage(baselinePath)]);
  const { pixelDiffCount, diffPercent, diffImage } = await getComparisons().run({
    capture,
    baseline,
    withDiffImage,
  });

  return {
    pixelDiffCount,
    diffPercent,
    diffImage: diffImage
      ? Buffer.from(diffImage.buffer, diffImage.byteOffset, diffImage.byteLength)
      : null,
  };
};
