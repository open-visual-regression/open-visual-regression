import { PNG } from "pngjs";
import { describe, expect, test, vi } from "vitest";

import { compareImages } from "../lib/images";

const WIDTH = 1280;
const HEIGHT = 1600;
const MB = 1024 ** 2;

const noisePng = (seed: number): Buffer => {
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  for (let i = 0; i < png.data.length; i++) {
    png.data[i] = (i * 31 + seed * 17) & 0xff;
  }
  return PNG.sync.write(png);
};

const images = new Map([
  ["capture.png", noisePng(1)],
  ["baseline.png", noisePng(2)],
]);

vi.mock("../lib/imageCache", () => ({
  readImage: async (imagePath: string) => ({ image: images.get(imagePath)!, cached: true }),
}));

const compareMany = async (count: number, concurrency: number): Promise<void> => {
  let started = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (started++ < count) {
        const { diffImage } = await compareImages("capture.png", "baseline.png", {
          withDiffImage: true,
        });
        expect(diffImage).not.toBeNull();
      }
    }),
  );
};

describe("compareImages", () => {
  // Each comparison encodes an ~8MB diff image, so retaining them shows up well past the limit.
  test("frees what each comparison allocates", { timeout: 120_000 }, async () => {
    await compareMany(10, 8);
    const before = process.memoryUsage().rss;

    await compareMany(100, 8);

    expect((process.memoryUsage().rss - before) / MB).toBeLessThan(200);
  });
});
