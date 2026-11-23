import { readFileSync } from "node:fs";
import { join } from "node:path";

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import { alignedDiff, type DiffMask } from "../alignedDiff";
import { padToCanvas, PIXELMATCH_THRESHOLD, type RgbaImage } from "../image";
import type { Rect } from "../types";

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

const pageBoxes = (offsetY = 0, offsetX = 0): Box[] => [
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
  pixelmatch(
    padToCanvas(baseline, width, height).data,
    padToCanvas(current, width, height).data,
    output,
    width,
    height,
    { threshold: PIXELMATCH_THRESHOLD, diffMask: true },
  );
  return Uint8Array.from({ length: width * height }, (_, pixel) =>
    output[pixel * 4 + 3] !== 0 && output[pixel * 4 + 1] === 0 ? 1 : 0,
  );
};

const isInside = (area: Rect, x: number, y: number) =>
  x >= area.x && y >= area.y && x < area.x + area.width && y < area.y + area.height;

/** How many pixels of a mask are marked inside `area`. */
const marksIn = ({ width, mask }: DiffMask, area: Rect) =>
  mask.reduce(
    (count, marked, pixel) =>
      count + (marked && isInside(area, pixel % width, Math.floor(pixel / width)) ? 1 : 0),
    0,
  );

/** How many pixels of a mask are marked outside every one of `areas`. */
const marksOutside = ({ width, mask }: DiffMask, areas: Rect[]) =>
  mask.reduce((count, marked, pixel) => {
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    return count + (marked && !areas.some((area) => isInside(area, x, y)) ? 1 : 0);
  }, 0);

// Screenshots of a sample app page rendered by Chromium, and crops of real
// OVR pages. Each scenario lists the areas marks on each side must lie in,
// each holding some of them.
const FIXTURES = join(import.meta.dirname, "fixtures/aligned");
const load = (name: string): RgbaImage => {
  const png = PNG.sync.read(readFileSync(join(FIXTURES, `${name}.png`)));
  return { width: png.width, height: png.height, data: png.data };
};

const HEADER = { x: 0, y: 0, width: 900, height: 56 };
const MAIN_COLUMN = { x: 224, y: 56, width: 452, height: 800 };
const ACTIVITY = { x: 740, y: 56, width: 160, height: 120 };
const FOOTER = { x: 0, y: 820, width: 900, height: 50 };

type Scenario = {
  baseline: string;
  current: string;
  /** Where marks on the baseline may be: what was removed or changed. */
  removed: Rect[];
  /** Where marks on the new image may be: what was added or changed. */
  added: Rect[];
};

const page = (current: string, removed: Rect[], added: Rect[]): Scenario => ({
  baseline: "baseline",
  current,
  removed,
  added,
});

const scenarios: Record<string, Scenario> = {
  "a banner inserted at the top": page("insert-top-banner", [], [{ ...HEADER, height: 46 }]),
  "footer links changed": page("change-bottom-footer", [FOOTER], [FOOTER]),
  // The sidebar's edge moved out, and the activity panel's text re-wrapped.
  "a wider sidebar": page(
    "change-left-sidebar-wider",
    [ACTIVITY],
    [{ x: 192, y: 48, width: 56, height: 768 }, ACTIVITY],
  ),
  "a recolored header badge": page("change-right-header-badge", [HEADER], [HEADER]),
  "a word changed in a side panel": page("change-right-panel-text", [ACTIVITY], [ACTIVITY]),
  "a tall section inserted": page(
    "tall-inserted-section",
    [],
    [{ ...MAIN_COLUMN, y: 240, height: 350 }],
  ),
  "a recolored toolbar": page(
    "wide-toolbar-color",
    [{ ...MAIN_COLUMN, y: 190, height: 60 }],
    [{ ...MAIN_COLUMN, y: 190, height: 60 }],
  ),
  "a recolored status dot": page(
    "small-status-dot",
    [{ x: 230, y: 210, width: 20, height: 20 }],
    [{ x: 230, y: 210, width: 20, height: 20 }],
  ),
  "a row of cards removed": page(
    "removed-cards-row",
    [{ ...MAIN_COLUMN, y: 340, height: 120 }],
    [],
  ),
  "recolored cards": page(
    "card-color-change",
    [{ ...MAIN_COLUMN, y: 260, height: 130 }],
    [{ ...MAIN_COLUMN, y: 260, height: 130 }],
  ),
  "a banner, a header button and the footer changed": page(
    "multiple-changes",
    [HEADER, FOOTER],
    [
      { ...HEADER, height: 46 },
      { ...HEADER, y: 46 },
      { ...FOOTER, y: 856, height: 46 },
    ],
  ),
  "a word edited in a sentence": page(
    "text-word-change",
    [{ ...MAIN_COLUMN, y: 160, height: 30 }],
    [{ ...MAIN_COLUMN, y: 160, height: 30 }],
  ),
  "a sentence that reflows onto an extra line": page(
    "text-reflow-extra-line",
    [{ ...MAIN_COLUMN, y: 160, height: 30 }],
    [{ ...MAIN_COLUMN, y: 160, height: 60 }],
  ),
  // A segment next to one of the same color was removed, so the alignment
  // can't tell which of the two went.
  "a segment removed from a bar": {
    baseline: "bar-segment-baseline",
    current: "bar-segment-removed",
    removed: [{ x: 90, y: 8, width: 285, height: 24 }],
    added: [{ x: 90, y: 8, width: 285, height: 24 }],
  },
  // A real header row: the status badge got 2px more padding on each side,
  // which moved the branch chips and links after it 4px to the right.
  "a badge whose padding grew": {
    baseline: "badge-padding-baseline",
    current: "badge-padding-wider",
    removed: [],
    added: [{ x: 12, y: 4, width: 100, height: 28 }],
  },
};

// Nothing moved in these, so both sides are exactly a plain pixel diff.
const unmovedScenarios = [
  "change-right-header-badge",
  "wide-toolbar-color",
  "small-status-dot",
  "card-color-change",
  "big-dark-theme",
];

describe("alignedDiff", () => {
  it("should mark nothing for identical images", () => {
    const image = drawImage(200, 120, pageBoxes());

    const diff = alignedDiff(image, image);

    expect(diff.plainChangedPixelCount).toBe(0);
    expect(marksOutside(diff.baseline, [])).toBe(0);
    expect(marksOutside(diff.current, [])).toBe(0);
  });

  it("should mark only a block inserted at the top, with its gap, on the new image", () => {
    const baseline = drawImage(200, 120, pageBoxes());
    const current = drawImage(200, 140, [
      { x: 0, y: 0, width: 200, height: 16, color: RED },
      ...pageBoxes(20),
    ]);

    const diff = alignedDiff(baseline, current);

    expect(marksIn(diff.current, { x: 0, y: 0, width: 200, height: 16 })).toBe(200 * 16);
    expect(marksOutside(diff.current, [{ x: 0, y: 0, width: 200, height: 20 }])).toBe(0);
    expect(marksOutside(diff.baseline, [])).toBe(0);
  });

  it("should mark a removed block where it was on the baseline, and nothing that moved up", () => {
    const baseline = drawImage(200, 120, pageBoxes());
    const current = drawImage(200, 120, [
      ...text(10, 10, 8, 1),
      ...text(10, 40, 10, 2),
      ...text(10, 60, 6, 3),
    ]);

    const diff = alignedDiff(baseline, current);

    expect(marksIn(diff.baseline, { x: 10, y: 30, width: 60, height: 20 })).toBeGreaterThan(0);
    expect(marksOutside(diff.baseline, [{ x: 0, y: 26, width: 200, height: 30 }])).toBe(0);
    expect(marksOutside(diff.current, [])).toBe(0);
  });

  it("should mark the space a gap grew by on the new image, and not what moved down", () => {
    const baseline = drawImage(200, 120, pageBoxes());
    const current = drawImage(
      200,
      130,
      pageBoxes(0).map((box) => (box.y >= 30 ? { ...box, y: box.y + 10 } : box)),
    );

    const diff = alignedDiff(baseline, current);

    const gap = { x: 0, y: 18, width: 200, height: 22 };
    expect(marksIn(diff.current, gap)).toBeGreaterThan(0);
    expect(marksOutside(diff.current, [gap])).toBe(0);
    expect(marksOutside(diff.baseline, [])).toBe(0);
  });

  it("should mark the space a gap shrank by on the baseline, and not what moved up", () => {
    const baseline = drawImage(
      200,
      130,
      pageBoxes(0).map((box) => (box.y >= 30 ? { ...box, y: box.y + 10 } : box)),
    );
    const current = drawImage(200, 120, pageBoxes());

    const diff = alignedDiff(baseline, current);

    const gap = { x: 0, y: 18, width: 200, height: 22 };
    expect(marksIn(diff.baseline, gap)).toBeGreaterThan(0);
    expect(marksOutside(diff.baseline, [gap])).toBe(0);
    expect(marksOutside(diff.current, [])).toBe(0);
  });

  it("should mark images of different widths in place on both sides", () => {
    const baseline = drawImage(200, 120, pageBoxes());
    const current = drawImage(220, 120, pageBoxes(0, 20));

    const diff = alignedDiff(baseline, current);

    expect(diff.baseline).toMatchObject({ width: 200, height: 120 });
    expect(diff.current).toMatchObject({ width: 220, height: 120 });
    expect(marksIn(diff.current, { x: 0, y: 0, width: 220, height: 120 })).toBe(
      diff.plainChangedPixelCount,
    );
  });

  it.each(Object.entries(scenarios))(
    "should mark only what changed for %s",
    (_, { baseline, current, removed, added }) => {
      const diff = alignedDiff(load(baseline), load(current));

      expect(marksOutside(diff.baseline, removed)).toBe(0);
      expect(marksOutside(diff.current, added)).toBe(0);
      expect([
        ...removed.map((area) => marksIn(diff.baseline, area)),
        ...added.map((area) => marksIn(diff.current, area)),
      ]).not.toContain(0);
    },
  );

  it.each(unmovedScenarios)("should match a plain pixel diff on both sides for %s", (name) => {
    const baseline = load("baseline");
    const current = load(name);

    const diff = alignedDiff(baseline, current);

    const plain = plainPixelMatch(baseline, current);
    expect(diff.baseline.mask).toEqual(plain);
    expect(diff.current.mask).toEqual(plain);
  });
});
