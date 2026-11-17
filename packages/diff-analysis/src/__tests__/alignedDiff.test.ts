import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { alignedDiff, renderAlignedDiff, type DiffRegion, type Rect } from "../alignedDiff";
import { decodePng, type DiffImage } from "../analyzeDiff";

type Color = [number, number, number];

type Box = Rect & { color: Color };

const WHITE: Color = [255, 255, 255];
const INK: Color = [20, 20, 20];
const BLUE: Color = [37, 99, 235];
const RED: Color = [220, 38, 38];

const drawImage = (width: number, height: number, boxes: Box[], background = WHITE): DiffImage => {
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

const kinds = (regions: DiffRegion[]) => regions.map((region) => region.kind);

const contains = (outer: Rect, inner: Rect) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

describe("alignedDiff", () => {
  it("should report nothing for identical images", () => {
    const image = drawImage(200, 120, page());

    const diff = alignedDiff(image, image);

    expect(diff.changedPixelCount).toBe(0);
    expect(diff.naivePixelCount).toBe(0);
    expect(diff.regions).toEqual([]);
  });

  it("should isolate a block inserted at the top instead of flagging everything below it", () => {
    const baseline = drawImage(200, 120, page());
    const current = drawImage(200, 140, [
      { x: 0, y: 0, width: 200, height: 16, color: RED },
      ...page(20),
    ]);

    const diff = alignedDiff(baseline, current);

    expect(diff.naivePixelCount).toBeGreaterThan(1000);
    expect(diff.regions).toEqual([
      {
        kind: "inserted",
        current: { x: 0, y: 0, width: 200, height: 16 },
        baseline: expect.any(Object),
      },
    ]);
    expect(diff.changedPixelCount).toBe(200 * 16);
  });

  it("should isolate content appended at the bottom", () => {
    const baseline = drawImage(200, 120, page());
    const current = drawImage(200, 150, [...page(), ...text(10, 125, 5)]);

    const diff = alignedDiff(baseline, current);

    expect(kinds(diff.regions)).toEqual(["inserted"]);
    expect(contains({ x: 10, y: 120, width: 80, height: 30 }, diff.regions[0]!.current)).toBe(true);
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
    expect(kinds(diff.regions)).toEqual(["deleted"]);
    expect(diff.regions[0]!.current.height).toBe(0);
    expect(diff.regions[0]!.baseline).toEqual({ x: 10, y: 30, width: 60, height: 20 });
  });

  it("should treat added blank space as a move, not a change", () => {
    const baseline = drawImage(200, 120, page());
    const current = drawImage(200, 150, page(30));

    const diff = alignedDiff(baseline, current);

    expect(diff.changedPixelCount).toBe(0);
    expect(diff.regions).toEqual([]);
  });

  it("should isolate a horizontal shift inside a band of rows", () => {
    const header = text(10, 2, 6, 4);
    const baseline = drawImage(220, 120, [...header, ...page(0, 0)]);
    const current = drawImage(220, 120, [
      ...header,
      { x: 10, y: 10, width: 8, height: 90, color: RED },
      ...page(0, 20),
    ]);

    const diff = alignedDiff(baseline, current);

    expect(diff.naivePixelCount).toBeGreaterThan(500);
    expect(kinds(diff.regions)).toEqual(["inserted"]);
    expect(contains({ x: 10, y: 10, width: 20, height: 90 }, diff.regions[0]!.current)).toBe(true);
  });

  it("should report an in-place change exactly like a pixel diff", () => {
    const baseline = drawImage(200, 120, page());
    const current = drawImage(200, 120, [
      ...page(),
      { x: 150, y: 90, width: 6, height: 6, color: RED },
    ]);

    const diff = alignedDiff(baseline, current);

    expect(diff.changedPixelCount).toBe(diff.naivePixelCount);
    expect(diff.regions).toEqual([
      {
        kind: "modified",
        current: { x: 150, y: 90, width: 6, height: 6 },
        baseline: { x: 150, y: 90, width: 6, height: 6 },
      },
    ]);
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

  it("should fall back to a plain pixel diff when nothing lines up", () => {
    const baseline = drawImage(120, 80, [], WHITE);
    const current = drawImage(120, 80, [], [10, 10, 40]);

    const diff = alignedDiff(baseline, current);

    expect(diff.changedPixelCount).toBe(diff.naivePixelCount);
    expect(diff.regions).toEqual([
      expect.objectContaining({
        kind: "modified",
        current: { x: 0, y: 0, width: 120, height: 80 },
      }),
    ]);
  });

  it("should stay correct when the edit budget is exceeded", () => {
    const stripes = (seed: number) =>
      Array.from({ length: 40 }, (_, index) => ({
        x: 0,
        y: index * 3,
        width: 100,
        height: 1,
        color: [(index * 37 + seed) % 255, 90, 140] as Color,
      }));
    const header = { x: 0, y: 0, width: 100, height: 4, color: INK };
    const baseline = drawImage(100, 130, [...stripes(0), header]);
    const current = drawImage(100, 130, [...stripes(101), header]);

    const diff = alignedDiff(baseline, current, { maxEditRatio: 0.01 });

    expect(diff.changedPixelCount).toBe(diff.naivePixelCount);
  });

  it("should render changed pixels over the current image", () => {
    const baseline = drawImage(40, 20, []);
    const current = drawImage(40, 20, [{ x: 5, y: 5, width: 4, height: 4, color: INK }]);

    const diff = alignedDiff(baseline, current);
    const rendered = renderAlignedDiff(current, diff);

    expect(rendered.width).toBe(40);
    const index = (6 * 40 + 6) * 4;
    expect(rendered.data[index]!).toBeGreaterThan(rendered.data[index + 1]! + 100);
  });
});

/**
 * Screenshots of a sample app page rendered by Chromium, regenerated with
 * `pnpm generate:fixtures`. Each scenario lists the regions the diff must
 * report: their kinds in reading order and a box each must lie within.
 */
const FIXTURES = join(import.meta.dirname, "fixtures/aligned");
const load = (name: string) => decodePng(readFileSync(join(FIXTURES, `${name}.png`)));
const baselinePage = load("baseline");

type Expectation = {
  regions: Array<{ kind: DiffRegion["kind"]; within: Rect }>;
  /** Whether alignment must flag fewer pixels than the plain pixel diff, or may match it. */
  improves: boolean;
};

const HEADER = { x: 0, y: 0, width: 900, height: 56 };
const MAIN_COLUMN = { x: 224, y: 56, width: 452, height: 800 };

const scenarios: Record<string, Expectation> = {
  "insert-top-banner": {
    improves: true,
    regions: [{ kind: "inserted", within: { x: 0, y: 0, width: 900, height: 46 } }],
  },
  "change-bottom-footer": {
    improves: false,
    regions: [{ kind: "modified", within: { x: 0, y: 820, width: 900, height: 50 } }],
  },
  "change-left-sidebar-wider": {
    improves: true,
    // The sidebar push itself is a pure shift; only the narrower activity
    // panel, whose text re-wrapped, really changed.
    regions: [{ kind: "modified", within: { x: 740, y: 56, width: 160, height: 120 } }],
  },
  "change-right-header-badge": {
    improves: false,
    regions: [{ kind: "modified", within: { x: 700, y: 0, width: 200, height: 56 } }],
  },
  "change-right-panel-text": {
    improves: false,
    regions: [{ kind: "modified", within: { x: 740, y: 56, width: 160, height: 120 } }],
  },
  "tall-inserted-section": {
    improves: true,
    regions: [{ kind: "inserted", within: { ...MAIN_COLUMN, y: 240, height: 350 } }],
  },
  "wide-toolbar-color": {
    improves: false,
    regions: [{ kind: "modified", within: { ...MAIN_COLUMN, y: 190, height: 60 } }],
  },
  "text-word-change": {
    improves: true,
    regions: [
      { kind: "modified", within: { ...MAIN_COLUMN, y: 160, height: 30 } },
      { kind: "modified", within: { ...MAIN_COLUMN, y: 160, height: 30 } },
    ],
  },
  "small-status-dot": {
    improves: false,
    regions: [{ kind: "modified", within: { x: 230, y: 210, width: 20, height: 20 } }],
  },
  "removed-cards-row": {
    improves: true,
    regions: [{ kind: "deleted", within: { ...MAIN_COLUMN, y: 340, height: 40 } }],
  },
  "card-color-change": {
    improves: false,
    regions: Array.from({ length: 6 }, () => ({
      kind: "modified" as const,
      within: { ...MAIN_COLUMN, y: 260, height: 130 },
    })),
  },
  "multiple-changes": {
    improves: true,
    regions: [
      { kind: "inserted", within: { x: 0, y: 0, width: 900, height: 46 } },
      { kind: "modified", within: { ...HEADER, y: 46 } },
      { kind: "modified", within: { x: 0, y: 870, width: 900, height: 46 } },
    ],
  },
};

describe("alignedDiff on rendered pages", () => {
  it.each(Object.entries(scenarios))("%s", (name, expectation) => {
    const current = load(name);

    const diff = alignedDiff(baselinePage, current);

    expect(kinds(diff.regions)).toEqual(expectation.regions.map((region) => region.kind));
    diff.regions.forEach((region, index) => {
      expect(region.current, `region ${index}`).toSatisfy((rect: Rect) =>
        contains(expectation.regions[index]!.within, rect),
      );
    });
    const limit = expectation.improves ? diff.naivePixelCount - 1 : diff.naivePixelCount;
    expect(diff.changedPixelCount).toBeLessThanOrEqual(limit);
  });

  it("should flag line reflow only where text moved between lines", () => {
    const diff = alignedDiff(baselinePage, load("text-reflow-extra-line"));

    expect(diff.changedPixelCount).toBeLessThan(diff.naivePixelCount / 4);
    expect(
      diff.regions.some((region) =>
        contains({ ...MAIN_COLUMN, y: 160, height: 60 }, region.current),
      ),
    ).toBe(true);
  });

  it("should match the pixel diff when the whole page changed", () => {
    const diff = alignedDiff(baselinePage, load("big-dark-theme"));

    expect(diff.changedPixelCount).toBe(diff.naivePixelCount);
    expect(kinds(diff.regions)).toEqual(["modified"]);
  });
});
