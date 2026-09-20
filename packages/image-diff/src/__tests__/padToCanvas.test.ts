import { describe, expect, it } from "vitest";

import { padToCanvas, type RgbaImage } from "../diffImages";

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

describe("padToCanvas", () => {
  it("should return the original pixels when the image already fills the canvas", () => {
    const image = solidImage(2, 2, WHITE);

    expect(padToCanvas(image, 2, 2)).toBe(image.data);
  });

  it("should keep each row's pixels at the start of the wider row", () => {
    const image = solidImage(1, 2, WHITE);

    const padded = padToCanvas(image, 2, 2);

    expect(padded).toHaveLength(2 * 2 * CHANNELS_PER_PIXEL);
    expect(Array.from(padded.subarray(0, 4))).toEqual([255, 255, 255, 255]);
    expect(Array.from(padded.subarray(4, 8))).toEqual([0, 0, 0, 0]);
    expect(Array.from(padded.subarray(8, 12))).toEqual([255, 255, 255, 255]);
  });

  it("should leave the area below a shorter image transparent", () => {
    const padded = padToCanvas(solidImage(2, 1, WHITE), 2, 2);

    expect(Array.from(padded.subarray(8))).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });
});
