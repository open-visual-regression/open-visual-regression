import { Piscina } from "piscina";
// Keeps sharp's native library loaded if the compare worker thread restarts.
import "sharp";

import { DEFAULT_DIFF_SETTINGS, type DiffHighlight } from "@ovr/api/contracts/settings";

import type { CompareImagesResult, CompareImagesTask } from "./compareImagesWorker";
import { readImage } from "./imageCache";

// The worker app bundles this module into dist/index.js, next to dist/compareImagesWorker.js.
const RUNNING_FROM_SOURCE = import.meta.url.endsWith(".ts");
const COMPARE_WORKER_URL = new URL(
  RUNNING_FROM_SOURCE ? "./compareImagesWorker.ts" : "./compareImagesWorker.js",
  import.meta.url,
);

let comparisons: Piscina<CompareImagesTask, CompareImagesResult> | undefined;

const getComparisons = (): Piscina<CompareImagesTask, CompareImagesResult> => {
  comparisons ??= new Piscina({
    filename: COMPARE_WORKER_URL.href,
    // Node's own TypeScript support can't resolve the worker's extensionless imports.
    execArgv: RUNNING_FROM_SOURCE ? [...process.execArgv, "--import", "tsx"] : undefined,
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
  {
    withDiffImage = false,
    diffHighlight = DEFAULT_DIFF_SETTINGS.highlight,
  }: { withDiffImage?: boolean; diffHighlight?: DiffHighlight } = {},
): Promise<ImageComparison> => {
  const readStart = performance.now();
  const [capture, baseline] = await Promise.all([readImage(capturePath), readImage(baselinePath)]);
  const compareStart = performance.now();
  const { pixelDiffCount, diffPercent, diffImage } = await getComparisons().run({
    capture: capture.image,
    baseline: baseline.image,
    withDiffImage,
    diffHighlight,
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
