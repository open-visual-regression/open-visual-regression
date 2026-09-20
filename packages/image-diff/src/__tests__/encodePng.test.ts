import { describe, expect, it } from "vitest";

import { decodePng, encodePng } from "../png";

const CHANNELS_PER_PIXEL = 4;

const solidPixels = (width: number, height: number, value: number): Uint8Array => {
  const data = new Uint8Array(width * height * CHANNELS_PER_PIXEL);

  for (let pixel = 0; pixel < width * height; pixel++) {
    data.set([value, value, value, 255], pixel * CHANNELS_PER_PIXEL);
  }

  return data;
};

describe("encodePng", () => {
  it("should produce a buffer decodePng reads back at the same size", () => {
    const encoded = encodePng(solidPixels(3, 2, 255), 3, 2);

    const decoded = decodePng(encoded);

    expect(decoded.width).toBe(3);
    expect(decoded.height).toBe(2);
  });
});
