import { describe, expect, it } from "vitest";

import { diffImages, type RgbaImage } from "../diffImages";

const CHANNELS_PER_PIXEL = 4;

const solidImage = (
  width: number,
  height: number,
  [r, g, b, a]: [number, number, number, number],
): RgbaImage => {
  const data = new Uint8Array(width * height * CHANNELS_PER_PIXEL);

  for (let pixel = 0; pixel < width * height; pixel++) {
    data.set([r, g, b, a], pixel * CHANNELS_PER_PIXEL);
  }

  return { width, height, data };
};

const WHITE: [number, number, number, number] = [255, 255, 255, 255];
const BLACK: [number, number, number, number] = [0, 0, 0, 255];

describe("diffImages", () => {
  it("should report no differing pixels for identical images", () => {
    const result = diffImages(solidImage(4, 4, WHITE), solidImage(4, 4, WHITE));

    expect(result.pixelDiffCount).toBe(0);
    expect(result.diffPercent).toBe(0);
  });

  it("should report every pixel differing for fully inverted images", () => {
    const result = diffImages(solidImage(4, 4, WHITE), solidImage(4, 4, BLACK));

    expect(result.pixelDiffCount).toBe(16);
    expect(result.diffPercent).toBe(100);
  });

  it("should express the diff percentage against the compared canvas area", () => {
    const baseline = solidImage(2, 2, WHITE);
    const capture = solidImage(2, 2, WHITE);
    capture.data.set(BLACK, 0);

    const result = diffImages(baseline, capture);

    expect(result.pixelDiffCount).toBe(1);
    expect(result.diffPercent).toBe(25);
  });

  it("should compare on a canvas large enough for both images", () => {
    const result = diffImages(solidImage(2, 4, WHITE), solidImage(4, 2, WHITE));

    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
  });

  it("should count the padding as differing when one image is larger", () => {
    const result = diffImages(solidImage(2, 2, WHITE), solidImage(4, 2, WHITE));

    expect(result.width).toBe(4);
    expect(result.pixelDiffCount).toBeGreaterThan(0);
  });

  it("should return a diff mask sized to the compared canvas", () => {
    const result = diffImages(solidImage(3, 2, WHITE), solidImage(3, 2, BLACK));

    expect(result.diffPixels).toHaveLength(3 * 2 * CHANNELS_PER_PIXEL);
  });
});
