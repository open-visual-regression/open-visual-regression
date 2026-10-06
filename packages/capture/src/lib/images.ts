import { diff as blazediff } from "@blazediff/core";
import { PNG } from "pngjs";

import { storage } from "@ovr/storage";

const COLOR_DELTA_THRESHOLD = 0.1;

const PNG_READ_TIMEOUT_MS = 30_000;

const readPng = async (imagePath: string): Promise<PNG> => {
  const stream = await storage.getFileStream(imagePath);
  const png = new PNG();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      stream.destroy();
      reject(new Error(`Timed out reading PNG: ${imagePath}`));
    }, PNG_READ_TIMEOUT_MS);

    const done = (result: PNG | Error) => {
      clearTimeout(timeout);
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve(result);
      }
    };

    stream.on("error", done);
    stream
      .pipe(png)
      .on("parsed", () => done(png))
      .on("error", done);
  });
};

export const encodePng = (pixels: Uint8Array, width: number, height: number): Buffer => {
  const png = new PNG({ width, height });
  png.data = Buffer.from(pixels);
  return PNG.sync.write(png);
};

type ImageComparison = {
  width: number;
  height: number;
  pixelDiffCount: number;
  diffPercent: number;
  diffPixels: Uint8Array;
};

export const compareImages = async (
  capturePath: string,
  baselinePath: string,
): Promise<ImageComparison> => {
  const [capturePixels, baselinePixels] = await Promise.all([
    readPng(capturePath),
    readPng(baselinePath),
  ]);

  const width = Math.max(capturePixels.width, baselinePixels.width);
  const height = Math.max(capturePixels.height, baselinePixels.height);

  const capturePadded = padToCanvas(capturePixels, width, height);
  const baselinePadded = padToCanvas(baselinePixels, width, height);
  const diffPixels = new Uint8Array(width * height * 4);

  const pixelDiffCount = blazediff(baselinePadded, capturePadded, diffPixels, width, height, {
    threshold: COLOR_DELTA_THRESHOLD,
    diffMask: true,
  });

  const diffPercent = (pixelDiffCount / (width * height)) * 100;

  return { width, height, pixelDiffCount, diffPercent, diffPixels };
};

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
