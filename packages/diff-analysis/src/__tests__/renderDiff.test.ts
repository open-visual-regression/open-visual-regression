import { describe, expect, it } from "vitest";

import { paintDiff, renderDiff } from "../renderDiff";

const maskOf = (width: number, height: number, marked: [number, number][]) => {
  const mask = new Uint8Array(width * height);
  for (const [x, y] of marked) {
    mask[y * width + x] = 1;
  }
  return { width, height, mask };
};

const alphaAt = (image: { width: number; data: Uint8Array }, x: number, y: number) =>
  image.data[(y * image.width + x) * 4 + 3];

describe("renderDiff", () => {
  it("should paint exactly the marked pixels solid, for the exact highlight", () => {
    const overlay = paintDiff(maskOf(40, 20, [[6, 6]]), "baseline");

    const pixelAt = (x: number, y: number) =>
      Array.from(overlay.data.subarray((y * 40 + x) * 4, (y * 40 + x + 1) * 4));
    expect(pixelAt(6, 6)).toEqual([255, 40, 40, 255]);
    expect(pixelAt(7, 6)).toEqual([0, 0, 0, 0]);
  });

  it.each([
    ["baseline", [255, 40, 40, 80]],
    ["current", [30, 200, 90, 80]],
  ] as const)(
    "should tint the %s side's areas and leave everything else transparent",
    (tint, color) => {
      const overlay = renderDiff(maskOf(40, 20, [[6, 6]]), tint);

      const pixelAt = (x: number, y: number) =>
        Array.from(overlay.data.subarray((y * 40 + x) * 4, (y * 40 + x + 1) * 4));
      expect(overlay).toMatchObject({ width: 40, height: 20 });
      expect(pixelAt(6, 6)).toEqual(color);
      expect(pixelAt(30, 15)).toEqual([0, 0, 0, 0]);
    },
  );

  it("should tint nearby marks as one area and distant ones separately", () => {
    const overlay = renderDiff(
      maskOf(100, 40, [
        [1, 1],
        [8, 1],
        [81, 31],
      ]),
      "current",
    );

    expect(alphaAt(overlay, 5, 1)).toBe(80);
    expect(alphaAt(overlay, 81, 31)).toBe(80);
    expect(alphaAt(overlay, 45, 20)).toBe(0);
  });
});
