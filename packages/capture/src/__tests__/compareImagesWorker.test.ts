import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import compareImages from "../lib/compareImagesWorker";

type Box = { x: number; y: number; width: number; height: number; color: number };

const PAGE: Box[] = [
  { x: 10, y: 10, width: 60, height: 8, color: 0x202020ff },
  { x: 10, y: 30, width: 90, height: 20, color: 0x2563ebff },
];

const drawPng = (width: number, height: number, boxes: Box[], colorType: 2 | 6 = 6): Uint8Array => {
  const png = new PNG({ width, height, colorType, inputHasAlpha: true });
  png.data.fill(255);
  for (const { x, y, width: boxWidth, height: boxHeight, color } of boxes) {
    for (let row = y; row < y + boxHeight; row++) {
      for (let column = x; column < x + boxWidth; column++) {
        png.data.writeUInt32BE(color, (row * width + column) * 4);
      }
    }
  }
  return PNG.sync.write(png);
};

const decode = (image: Uint8Array | null) => PNG.sync.read(Buffer.from(image ?? []));

describe("compareImages", () => {
  it("should report no difference and no diff image for identical screenshots", async () => {
    const image = drawPng(120, 80, PAGE);

    const result = await compareImages({ capture: image, baseline: image, withDiffImage: true });

    expect(result).toEqual({ pixelDiffCount: 0, diffPercent: 0, diffImage: null });
  });

  it("should count changed pixels and draw them in the diff image", async () => {
    const baseline = drawPng(120, 80, PAGE);
    const capture = drawPng(120, 80, [
      ...PAGE,
      { x: 10, y: 60, width: 10, height: 5, color: 0xdc2626ff },
    ]);

    const result = await compareImages({ capture, baseline, withDiffImage: true });
    const diffImage = decode(result.diffImage);

    expect(result.pixelDiffCount).toBe(50);
    expect(result.diffPercent).toBeCloseTo((50 / (120 * 80)) * 100);
    expect({ width: diffImage.width, height: diffImage.height }).toEqual({
      width: 120,
      height: 80,
    });
    expect([...diffImage.data.subarray((62 * 120 + 12) * 4, (62 * 120 + 13) * 4)]).toEqual([
      255, 0, 0, 255,
    ]);
    expect(diffImage.data[(5 * 120 + 5) * 4 + 3]).toBe(0);
  });

  it("should compare screenshots saved without an alpha channel", async () => {
    const baseline = drawPng(120, 80, PAGE, 2);
    const capture = drawPng(120, 80, PAGE, 6);

    const result = await compareImages({ capture, baseline, withDiffImage: true });

    expect(result.pixelDiffCount).toBe(0);
  });

  it("should count the extra area of a taller screenshot as changed", async () => {
    const baseline = drawPng(120, 80, PAGE);
    const capture = drawPng(120, 100, PAGE);

    const result = await compareImages({ capture, baseline, withDiffImage: true });

    expect(result.pixelDiffCount).toBe(120 * 20);
    expect(decode(result.diffImage).height).toBe(100);
  });

  it("should leave out the diff image when it isn't asked for", async () => {
    const baseline = drawPng(120, 80, PAGE);
    const capture = drawPng(120, 100, PAGE);

    const result = await compareImages({ capture, baseline, withDiffImage: false });

    expect(result.diffImage).toBeNull();
  });
});
