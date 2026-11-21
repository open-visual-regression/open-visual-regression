import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import compareImages from "../lib/compareImagesWorker";

type Box = { x: number; y: number; width: number; height: number; color: number };

const WIDTH = 120;
const PAGE: Box[] = [
  { x: 10, y: 10, width: 60, height: 8, color: 0x202020ff },
  { x: 10, y: 30, width: 90, height: 20, color: 0x2563ebff },
  { x: 10, y: 60, width: 40, height: 8, color: 0x202020ff },
];

const drawPng = (height: number, boxes: Box[], colorType: 2 | 6 = 6): Uint8Array => {
  const png = new PNG({ width: WIDTH, height, colorType, inputHasAlpha: true });
  png.data.fill(255);
  for (const { x, y, width, height: boxHeight, color } of boxes) {
    for (let row = y; row < y + boxHeight; row++) {
      for (let column = x; column < x + width; column++) {
        png.data.writeUInt32BE(color, (row * WIDTH + column) * 4);
      }
    }
  }
  return PNG.sync.write(png);
};

const shiftedDown = (boxes: Box[], by: number) => boxes.map((box) => ({ ...box, y: box.y + by }));

const alphaAt = (image: Uint8Array | null, x: number, y: number) => {
  const png = PNG.sync.read(Buffer.from(image ?? []));
  return png.data[(y * png.width + x) * 4 + 3];
};

describe("compareImages", async () => {
  it("should report no difference and no diff image for identical screenshots", async () => {
    const image = drawPng(80, PAGE);

    const result = await compareImages({
      capture: image,
      baseline: image,
      withDiffImage: true,
      diffAlgorithm: "aligned",
    });

    expect(result).toEqual({ pixelDiffCount: 0, diffPercent: 0, diffImage: null });
  });

  it("should mark the content an inserted banner pushed down with the pixel algorithm", async () => {
    const baseline = drawPng(80, PAGE);
    const capture = drawPng(100, [
      { x: 0, y: 0, width: WIDTH, height: 16, color: 0xdc2626ff },
      ...shiftedDown(PAGE, 20),
    ]);

    const result = await compareImages({
      capture,
      baseline,
      withDiffImage: true,
      diffAlgorithm: "pixel",
    });

    expect(alphaAt(result.diffImage, 60, 8)).toBe(255);
    expect(alphaAt(result.diffImage, 50, 55)).toBe(255);
  });

  it("should mark only the inserted banner in the diff image, not the content it pushed down", async () => {
    const baseline = drawPng(80, PAGE);
    const capture = drawPng(100, [
      { x: 0, y: 0, width: WIDTH, height: 16, color: 0xdc2626ff },
      ...shiftedDown(PAGE, 20),
    ]);

    const result = await compareImages({
      capture,
      baseline,
      withDiffImage: true,
      diffAlgorithm: "aligned",
    });

    expect(result.pixelDiffCount).toBeGreaterThan(0);
    expect(alphaAt(result.diffImage, 60, 8)).toBe(90);
    expect(alphaAt(result.diffImage, 50, 55)).toBe(0);
  });

  it("should wash the added space, not the content it pushed down, when only blank space grew", async () => {
    const baseline = drawPng(80, PAGE);
    const capture = drawPng(100, shiftedDown(PAGE, 20));

    const result = await compareImages({
      capture,
      baseline,
      withDiffImage: true,
      diffAlgorithm: "aligned",
    });

    expect(result.pixelDiffCount).toBeGreaterThan(0);
    expect(alphaAt(result.diffImage, 50, 20)).toBe(90);
    expect(alphaAt(result.diffImage, 50, 55)).toBe(0);
  });

  it("should outline a button that moved instead of painting it", async () => {
    const button = { y: 20, width: 30, height: 14 };
    const baseline = drawPng(60, [
      { ...button, x: 10, color: 0x202020ff },
      { ...button, x: 50, color: 0x2563ebff },
    ]);
    const capture = drawPng(60, [
      { ...button, x: 10, color: 0x2563ebff },
      { ...button, x: 50, color: 0x202020ff },
    ]);

    const result = await compareImages({
      capture,
      baseline,
      withDiffImage: true,
      diffAlgorithm: "aligned",
    });

    expect(result.pixelDiffCount).toBeGreaterThan(0);
    expect(alphaAt(result.diffImage, 25, 27)).toBe(0);
  });

  it.each([
    [
      "a change in place",
      drawPng(80, [...PAGE, { x: 10, y: 60, width: 40, height: 8, color: 0xdc2626ff }]),
    ],
    ["content that moved", drawPng(100, shiftedDown(PAGE, 20))],
  ])("should count %s the same with or without a diff image", async (_, capture) => {
    const baseline = drawPng(80, PAGE);

    const withImage = await compareImages({
      capture,
      baseline,
      withDiffImage: true,
      diffAlgorithm: "aligned",
    });
    const withoutImage = await compareImages({
      capture,
      baseline,
      withDiffImage: false,
      diffAlgorithm: "aligned",
    });

    expect(withImage.pixelDiffCount).toBeGreaterThan(0);
    expect(withImage.pixelDiffCount).toBe(withoutImage.pixelDiffCount);
  });

  it("should compare screenshots saved without an alpha channel", async () => {
    const baseline = drawPng(80, PAGE, 2);
    const capture = drawPng(80, PAGE, 6);

    const result = await compareImages({
      capture,
      baseline,
      withDiffImage: true,
      diffAlgorithm: "aligned",
    });

    expect(result.pixelDiffCount).toBe(0);
  });

  it("should count the extra area of a taller screenshot as changed", async () => {
    const baseline = drawPng(80, PAGE);
    const capture = drawPng(100, PAGE);

    const result = await compareImages({
      capture,
      baseline,
      withDiffImage: true,
      diffAlgorithm: "aligned",
    });

    expect(result.pixelDiffCount).toBe(WIDTH * 20);
  });

  it("should leave out the diff image when it isn't asked for", async () => {
    const baseline = drawPng(80, PAGE);
    const capture = drawPng(80, shiftedDown(PAGE, 5));

    const result = await compareImages({
      capture,
      baseline,
      withDiffImage: false,
      diffAlgorithm: "aligned",
    });

    expect(result.diffImage).toBeNull();
  });
});
