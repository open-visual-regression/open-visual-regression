import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import { decodePng } from "../analyzeDiff";

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
