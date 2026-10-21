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
    // "sync" atomics park the thread in Atomics.wait, so its event loop never runs, and zlib
    // releases a closed handle (with the buffer it compressed) only from that loop.
    atomics: "disabled",
  });
  return comparisons;
};

type ImageComparison = {
  pixelDiffCount: number;
  diffPercent: number;
  diffImage: Buffer | null;
  cachedImages: number;
  timings: { read: number; compare: number };
};

export const compareImages = async (
  capturePath: string,
  baselinePath: string,
  { withDiffImage = false }: { withDiffImage?: boolean } = {},
): Promise<ImageComparison> => {
  const readStart = performance.now();
  const [capture, baseline] = await Promise.all([readImage(capturePath), readImage(baselinePath)]);
  const compareStart = performance.now();
  const { pixelDiffCount, diffPercent, diffImage } = await getComparisons().run({
    capture: capture.image,
    baseline: baseline.image,
    withDiffImage,
  });

  return {
    pixelDiffCount,
    diffPercent,
    diffImage: diffImage
      ? Buffer.from(diffImage.buffer, diffImage.byteOffset, diffImage.byteLength)
      : null,
    cachedImages: Number(capture.cached) + Number(baseline.cached),
    timings: {
      read: Math.round(compareStart - readStart),
      compare: Math.round(performance.now() - compareStart),
    },
  };
};
