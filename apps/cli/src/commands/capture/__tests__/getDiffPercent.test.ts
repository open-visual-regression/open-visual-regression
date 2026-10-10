import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import { getDiffPercent } from "../compare";

type Pixel = [number, number, number];

const encodeImage = (width: number, height: number, changed: Pixel | null = null): Buffer => {
  const png = new PNG({ width, height });
  for (let index = 0; index < width * height; index++) {
    png.data.set([20, 20, 20, 255], index * 4);
  }
  if (changed) {
    png.data.set([...changed, 255], 0);
  }
  return PNG.sync.write(png);
};

describe("getDiffPercent", () => {
  it("should report no difference between identical screenshots", () => {
    expect(getDiffPercent(encodeImage(10, 10), encodeImage(10, 10))).toBe(0);
  });

  it("should report the share of pixels that changed", () => {
    expect(getDiffPercent(encodeImage(10, 10), encodeImage(10, 10, [255, 0, 0]))).toBe(1);
  });

  it("should count the extra area of a taller screenshot as changed", () => {
    expect(getDiffPercent(encodeImage(10, 10), encodeImage(10, 20))).toBe(50);
  });
});
