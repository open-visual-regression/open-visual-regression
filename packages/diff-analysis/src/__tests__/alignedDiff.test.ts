import { readFileSync } from "node:fs";
import { join } from "node:path";

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import { alignedDiff } from "../alignedDiff";
import { padToCanvas, PIXELMATCH_THRESHOLD, type RgbaImage } from "../image";
import { renderDiff } from "../renderDiff";
import type { Rect, Region } from "../types";

type Color = [number, number, number];

type Box = Rect & { color: Color };

const WHITE: Color = [255, 255, 255];
const INK: Color = [20, 20, 20];
const BLUE: Color = [37, 99, 235];
const RED: Color = [220, 38, 38];

const drawImage = (width: number, height: number, boxes: Box[], background = WHITE): RgbaImage => {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const box = [...boxes]
        .reverse()
        .find(
          (candidate) =>
            x >= candidate.x &&
            x < candidate.x + candidate.width &&
            y >= candidate.y &&
            y < candidate.y + candidate.height,
        );
      const [red, green, blue] = box ? box.color : background;
      data.set([red, green, blue, 255], (y * width + x) * 4);
    }
  }
  return { width, height, data };
};

/** A block of "text": alternating short bars so lines and columns are distinctive. */
const text = (x: number, y: number, words: number, seed = 0): Box[] =>
  Array.from({ length: words }, (_, index) => ({
    x: x + index * 14,
    y: y + ((index + seed) % 3),
    width: 6 + ((index * 7 + seed) % 6),
    height: 6,
    color: INK,
  }));

const page = (offsetY = 0, offsetX = 0): Box[] => [
  ...text(10 + offsetX, 10 + offsetY, 8, 1),
  { x: 10 + offsetX, y: 30 + offsetY, width: 60, height: 20, color: BLUE },
  ...text(10 + offsetX, 60 + offsetY, 10, 2),
  ...text(10 + offsetX, 80 + offsetY, 6, 3),
];

/** What a plain position-by-position pixelmatch reports, for comparison. */
const plainPixelMatch = (baseline: RgbaImage, current: RgbaImage) => {
  const width = Math.max(baseline.width, current.width);
  const height = Math.max(baseline.height, current.height);
  const output = new Uint8Array(width * height * 4);
  const count = pixelmatch(
    padToCanvas(baseline, width, height).data,
    padToCanvas(current, width, height).data,
    output,
    width,
    height,
    { threshold: PIXELMATCH_THRESHOLD, diffMask: true },
  );
  return { count, output, width };
};

const plainPixelDiff = (baseline: RgbaImage, current: RgbaImage): number =>
  plainPixelMatch(baseline, current).count;

/** Pixels an aligned diff flags that a plain pixel diff, comparing in place, does not. */
const flaggedOnlyWhenAligned = (baseline: RgbaImage, current: RgbaImage) => {
  const diff = alignedDiff(baseline, current);
  const plain = plainPixelMatch(baseline, current);
  let count = 0;
  for (let pixel = 0; pixel < diff.mask.length; pixel++) {
    const y = Math.floor(pixel / diff.width);
    const x = pixel % diff.width;
    const index = (y * plain.width + x) * 4;
    const plainChanged = plain.output[index + 3] !== 0 && plain.output[index + 1] === 0;
    count += diff.mask[pixel] && !plainChanged ? 1 : 0;
  }
  return count;
};

const kinds = (regions: Region[]) => regions.map((region) => region.kind);

const contains = (outer: Rect, inner: Rect) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

expect.extend({
  /** Passes when a rect lies entirely inside `outer`. */
  toBeWithin(received: Rect, outer: Rect) {
    return {
      pass: contains(outer, received),
      message: () => `expected ${JSON.stringify(received)} to lie within ${JSON.stringify(outer)}`,
    };
  },
});

declare module "vitest" {
  // Extending Vitest's matcher types only works through interface merging.
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface AsymmetricMatchersContaining {
    toBeWithin(outer: Rect): unknown;
  }
}

// Screenshots of a sample app page rendered by Chromium. Each scenario lists
// the regions the diff must report, in reading order, and a box each lies within.
const FIXTURES = join(import.meta.dirname, "fixtures/aligned");
const load = (name: string): RgbaImage => {
  const png = PNG.sync.read(readFileSync(join(FIXTURES, `${name}.png`)));
  return { width: png.width, height: png.height, data: png.data };
};
const baselinePage = load("baseline");

type ExpectedRegion = { kind: Region["kind"]; within: Rect };

const HEADER = { x: 0, y: 0, width: 900, height: 56 };
const MAIN_COLUMN = { x: 224, y: 56, width: 452, height: 800 };

const expectedRegions: Record<string, ExpectedRegion[]> = {
  "insert-top-banner": [{ kind: "inserted", within: { x: 0, y: 0, width: 900, height: 46 } }],
  "change-bottom-footer": [{ kind: "changed", within: { x: 0, y: 820, width: 900, height: 50 } }],
  // The wider sidebar only pushed content sideways; the activity panel's text re-wrapped.
  "change-left-sidebar-wider": [
    { kind: "changed", within: { x: 740, y: 56, width: 160, height: 120 } },
  ],
  "change-right-header-badge": [
    { kind: "changed", within: { x: 700, y: 0, width: 200, height: 56 } },
  ],
  "change-right-panel-text": [
    { kind: "changed", within: { x: 740, y: 56, width: 160, height: 120 } },
  ],
  "tall-inserted-section": [{ kind: "inserted", within: { ...MAIN_COLUMN, y: 240, height: 350 } }],
  "wide-toolbar-color": [{ kind: "changed", within: { ...MAIN_COLUMN, y: 190, height: 60 } }],
  "small-status-dot": [{ kind: "changed", within: { x: 230, y: 210, width: 20, height: 20 } }],
  "removed-cards-row": [{ kind: "deleted", within: { ...MAIN_COLUMN, y: 340, height: 40 } }],
  "card-color-change": Array.from({ length: 6 }, () => ({
    kind: "changed" as const,
    within: { ...MAIN_COLUMN, y: 260, height: 130 },
  })),
  "multiple-changes": [
    { kind: "inserted", within: { x: 0, y: 0, width: 900, height: 46 } },
    { kind: "changed", within: { ...HEADER, y: 46 } },
    { kind: "changed", within: { x: 0, y: 870, width: 900, height: 46 } },
  ],
};

const allScenarios = [
  ...Object.keys(expectedRegions),
  "text-word-change",
  "text-reflow-extra-line",
  "big-dark-theme",
];

// Nothing moved in these, so the result is exactly a plain pixel diff.
const unmovedScenarios = [
  "change-right-header-badge",
  "wide-toolbar-color",
  "small-status-dot",
  "card-color-change",
  "big-dark-theme",
];

describe("alignedDiff", () => {
  it("should report nothing for identical images", () => {
    const image = drawImage(200, 120, page());

    const diff = alignedDiff(image, image);

    expect(diff.changedPixelCount).toBe(0);
    expect(diff.regions).toEqual([]);
  });

  it("should isolate a block inserted at the top instead of flagging everything below it", () => {
    const baseline = drawImage(200, 120, page());
    const current = drawImage(200, 140, [
      { x: 0, y: 0, width: 200, height: 16, color: RED },
      ...page(20),
    ]);

    const diff = alignedDiff(baseline, current);

    expect(plainPixelDiff(baseline, current)).toBeGreaterThan(1000);
    expect(diff.regions).toEqual([
      {
        kind: "inserted",
        current: { x: 0, y: 0, width: 200, height: 16 },
        baseline: expect.any(Object),
      },
    ]);
    expect(diff.changedPixelCount).toBe(200 * 16);
  });

  it("should report removed content as a deletion with no changed pixels", () => {
    const baseline = drawImage(200, 120, page());
    const current = drawImage(200, 120, [
      ...text(10, 10, 8, 1),
      ...text(10, 40, 10, 2),
      ...text(10, 60, 6, 3),
    ]);

    const diff = alignedDiff(baseline, current);

    expect(diff.changedPixelCount).toBe(0);
    expect(diff.regions).toEqual([
      expect.objectContaining({
        kind: "deleted",
        current: expect.objectContaining({ height: 0 }),
        baseline: { x: 10, y: 30, width: 60, height: 20 },
      }),
    ]);
  });

  it("should show added blank space as inserted without counting it as changed", () => {
    const baseline = drawImage(200, 120, page());
    const current = drawImage(200, 150, page(30));

    const diff = alignedDiff(baseline, current);

    expect(diff.changedPixelCount).toBe(0);
    expect(diff.regions).toEqual([
      expect.objectContaining({
        kind: "inserted",
        current: { x: 0, y: 10, width: 200, height: 30 },
      }),
    ]);
  });

  it("should report two boxes that swapped places as a move, not a change", () => {
    const header = text(10, 2, 6, 4);
    const first = { y: 30, width: 40, height: 20, color: BLUE };
    const second = { y: 30, width: 30, height: 20, color: RED };
    const baseline = drawImage(200, 80, [...header, { ...first, x: 100 }, { ...second, x: 150 }]);
    const current = drawImage(200, 80, [...header, { ...second, x: 100 }, { ...first, x: 140 }]);

    const diff = alignedDiff(baseline, current);

    expect(plainPixelDiff(baseline, current)).toBeGreaterThan(0);
    expect(diff.changedPixelCount).toBe(0);
    expect(kinds(diff.regions)).toContain("moved");
    expect(kinds(diff.regions)).not.toContain("changed");
  });

  it("should report separate changes as separate regions", () => {
    const baseline = drawImage(200, 120, page());
    const current = drawImage(200, 120, [
      ...page(),
      { x: 180, y: 5, width: 6, height: 6, color: RED },
      { x: 180, y: 105, width: 6, height: 6, color: RED },
    ]);

    const diff = alignedDiff(baseline, current);

    expect(diff.regions.map((region) => region.current)).toEqual([
      { x: 180, y: 5, width: 6, height: 6 },
      { x: 180, y: 105, width: 6, height: 6 },
    ]);
  });

  it("should render changed pixels as an overlay with everything else transparent", () => {
    const baseline = drawImage(40, 20, []);
    const current = drawImage(40, 20, [{ x: 5, y: 5, width: 4, height: 4, color: INK }]);

    const overlay = renderDiff(alignedDiff(baseline, current));

    const pixelAt = (x: number, y: number) =>
      Array.from(overlay.data.subarray((y * 40 + x) * 4, (y * 40 + x + 1) * 4));
    expect(overlay).toMatchObject({ width: 40, height: 20 });
    expect(pixelAt(6, 6)).toEqual([255, 0, 0, 255]);
    expect(pixelAt(30, 15)).toEqual([0, 0, 0, 0]);
  });

  it("should mark inserted content like any change and draw removed content as a line", () => {
    const baseline = drawImage(200, 120, page());
    const current = drawImage(200, 140, [
      { x: 0, y: 0, width: 200, height: 16, color: RED },
      ...page(20),
    ]);

    const removed = renderDiff(alignedDiff(current, baseline));
    const inserted = renderDiff(alignedDiff(baseline, current));

    const alphaAt = (image: RgbaImage, x: number, y: number) =>
      image.data[(y * image.width + x) * 4 + 3];
    expect(alphaAt(inserted, 100, 8)).toBe(255);
    expect(alphaAt(inserted, 100, 60)).toBe(0);
    expect(alphaAt(removed, 100, 0)).toBe(255);
    expect(alphaAt(removed, 100, 60)).toBe(0);
  });

  it.each(Object.entries(expectedRegions))(
    "should report the expected regions for %s",
    (name, regions) => {
      const diff = alignedDiff(baselinePage, load(name));

      expect(diff.regions).toEqual(
        regions.map(({ kind, within }) => ({
          kind,
          current: expect.toBeWithin(within),
          baseline: expect.anything(),
        })),
      );
    },
  );

  it.each(allScenarios)("should only flag pixels that also differ in place for %s", (name) => {
    expect(flaggedOnlyWhenAligned(baselinePage, load(name))).toBe(0);
  });

  it.each(unmovedScenarios)("should match a plain pixel diff exactly for %s", (name) => {
    const current = load(name);

    const diff = alignedDiff(baselinePage, current);

    expect(diff.changedPixelCount).toBe(plainPixelDiff(baselinePage, current));
  });

  it("should flag only the sentence with the edited word", () => {
    const current = load("text-word-change");

    const diff = alignedDiff(baselinePage, current);

    // Which of several equally good alignments is picked decides how the
    // sentence splits into regions, so only where they sit is checked.
    const sentence = { ...MAIN_COLUMN, y: 160, height: 30 };
    const outsideSentence = diff.regions.filter((region) => !contains(sentence, region.current));
    expect(diff.regions).not.toEqual([]);
    expect(outsideSentence).toEqual([]);
    expect(diff.changedPixelCount).toBeLessThan(plainPixelDiff(baselinePage, current));
  });

  it("should flag line reflow only where text moved between lines", () => {
    const current = load("text-reflow-extra-line");

    const diff = alignedDiff(baselinePage, current);

    expect(diff.changedPixelCount).toBeLessThan(plainPixelDiff(baselinePage, current) / 4);
    expect(diff.regions).toContainEqual(
      expect.objectContaining({
        current: expect.toBeWithin({ ...MAIN_COLUMN, y: 160, height: 60 }),
      }),
    );
  });
});
