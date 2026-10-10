import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import { analyzeDiff, decodePng, type DiffImage } from "../analyzeDiff";

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: [number, number, number];
};

const BACKGROUND: [number, number, number] = [20, 20, 20];

const drawImage = (width: number, height: number, boxes: Box[]): DiffImage => {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const box = boxes.find(
        (candidate) =>
          x >= candidate.x &&
          x < candidate.x + candidate.width &&
          y >= candidate.y &&
          y < candidate.y + candidate.height,
      );
      const [red, green, blue] = box ? box.color : BACKGROUND;
      data.set([red, green, blue, 255], (y * width + x) * 4);
    }
  }

  return { width, height, data };
};

const card = (x: number, y: number): Box[] => [
  { x: x + 5, y: y + 5, width: 10, height: 10, color: [220, 40, 40] },
  { x, y, width: 40, height: 20, color: [200, 200, 200] },
];

describe("analyzeDiff", () => {
  it("should report no change for identical images", () => {
    const image = drawImage(100, 60, card(20, 20));

    expect(analyzeDiff(image, image)).toEqual({
      changedPixelCount: 0,
      changedRegion: null,
      shift: null,
      sizeChange: null,
    });
  });

  it("should detect content that moved", () => {
    const baseline = drawImage(100, 60, card(30, 20));
    const current = drawImage(100, 60, card(11, 23));

    const analysis = analyzeDiff(baseline, current);

    expect(analysis.shift).toEqual({ x: -19, y: 3, explainedPercent: 100 });
    expect(analysis.changedRegion).toEqual({ x: 11, y: 20, width: 59, height: 23 });
  });

  it("should not report a shift when content changed color in place", () => {
    const baseline = drawImage(100, 60, card(30, 20));
    const current = drawImage(100, 60, [
      { x: 35, y: 25, width: 10, height: 10, color: [40, 40, 220] },
      ...card(30, 20).slice(1),
    ]);

    const analysis = analyzeDiff(baseline, current);

    expect(analysis.changedRegion).toEqual({ x: 35, y: 25, width: 10, height: 10 });
    expect(analysis.shift).toBeNull();
  });

  it("should report a change in size", () => {
    const baseline = drawImage(100, 60, card(20, 20));
    const current = drawImage(100, 80, card(20, 20));

    expect(analyzeDiff(baseline, current).sizeChange).toEqual({
      from: { width: 100, height: 60 },
      to: { width: 100, height: 80 },
    });
  });
});

describe("decodePng", () => {
  it("should read a PNG's size and pixels", () => {
    const png = new PNG({ width: 2, height: 1 });
    png.data.set([1, 2, 3, 255, 4, 5, 6, 255]);

    const image = decodePng(PNG.sync.write(png));

    expect(image.width).toBe(2);
    expect(image.height).toBe(1);
    expect([...image.data]).toEqual([1, 2, 3, 255, 4, 5, 6, 255]);
  });
});
