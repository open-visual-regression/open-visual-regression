// Stress test for alignedDiff: large images and adversarial inputs.
// Run with `pnpm dlx tsx scripts/stressAlignedDiff.ts [case-name-filter]`.
import { alignedDiff, type AlignedDiff } from "../src/alignedDiff";
import type { DiffImage } from "../src/analyzeDiff";

type Rgb = [number, number, number];

const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

class Canvas {
  readonly data: Uint8Array;
  constructor(
    readonly width: number,
    readonly height: number,
    background: Rgb = [255, 255, 255],
  ) {
    this.data = new Uint8Array(width * height * 4);
    for (let index = 0; index < width * height; index++) {
      this.data.set([...background, 255], index * 4);
    }
  }
  fill(x: number, y: number, width: number, height: number, color: Rgb) {
    for (let row = Math.max(0, y); row < Math.min(this.height, y + height); row++) {
      for (let column = Math.max(0, x); column < Math.min(this.width, x + width); column++) {
        this.data.set([...color, 255], (row * this.width + column) * 4);
      }
    }
  }
  image(): DiffImage {
    return { width: this.width, height: this.height, data: this.data };
  }
}

type Block = { kind: "text" | "box" | "gap"; height: number; seed: number; color?: Rgb };

/** A page description: a vertical list of blocks inside a column at `left`. */
const pageBlocks = (count: number, seed: number): Block[] => {
  const random = rng(seed);
  return Array.from({ length: count }, (_, index) => {
    const roll = random();
    if (roll < 0.6) {
      return { kind: "text", height: 18, seed: seed * 1000 + index };
    }
    if (roll < 0.8) {
      return {
        kind: "box",
        height: 40 + Math.floor(random() * 120),
        seed: index,
        color: [Math.floor(random() * 200), Math.floor(random() * 200), 200],
      };
    }
    return { kind: "gap", height: 8 + Math.floor(random() * 24), seed: index };
  });
};

const drawText = (canvas: Canvas, x: number, y: number, width: number, seed: number) => {
  const random = rng(seed);
  let cursor = x;
  while (cursor < x + width - 40) {
    const word = 10 + Math.floor(random() * 50);
    for (let glyph = 0; glyph < word; glyph += 7) {
      const glyphHeight = 6 + Math.floor(random() * 6);
      canvas.fill(cursor + glyph, y + 12 - glyphHeight, 5, glyphHeight, [30, 30, 30]);
    }
    cursor += word + 8;
  }
};

const renderPage = (
  width: number,
  blocks: Block[],
  options: { left?: number; sidebar?: number; height?: number } = {},
): DiffImage => {
  const left = options.left ?? 220;
  const total = blocks.reduce((sum, block) => sum + block.height + 8, 80);
  const canvas = new Canvas(width, options.height ?? total);
  canvas.fill(0, 0, width, 56, [17, 24, 39]);
  drawText(canvas, 24, 22, 200, 1);
  canvas.fill(0, 56, options.sidebar ?? 200, canvas.height - 56, [243, 244, 246]);
  for (let item = 0; item < 8; item++) {
    drawText(canvas, 16, 80 + item * 28, 150, 100 + item);
  }
  let y = 72;
  for (const block of blocks) {
    if (block.kind === "text") {
      drawText(canvas, left, y, width - left - 40, block.seed);
    } else if (block.kind === "box") {
      canvas.fill(left, y, width - left - 40, block.height, block.color!);
    }
    y += block.height + 8;
  }
  return canvas.image();
};

const noise = (width: number, height: number, seed: number): DiffImage => {
  const random = rng(seed);
  const data = new Uint8Array(width * height * 4);
  for (let index = 0; index < data.length; index++) {
    data[index] = index % 4 === 3 ? 255 : Math.floor(random() * 256);
  }
  return { width, height, data };
};

/** Adds ±1 noise to every channel, like subpixel anti-aliasing drift. */
const jitter = (image: DiffImage, seed: number, share: number): DiffImage => {
  const random = rng(seed);
  const data = image.data.slice();
  for (let index = 0; index < data.length; index += 4) {
    if (random() < share) {
      data[index] = Math.min(255, data[index]! + 1);
    }
  }
  return { ...image, data };
};

type Case = {
  name: string;
  build: () => { baseline: DiffImage; current: DiffImage };
  /** Returns a failure message, or null when the result looks right. */
  check: (diff: AlignedDiff) => string | null;
};

const expectAtMost = (diff: AlignedDiff, pixels: number) =>
  diff.changedPixelCount <= pixels ? null : `changed ${diff.changedPixelCount} > ${pixels}`;
const expectSameAsNaive = (diff: AlignedDiff) =>
  diff.changedPixelCount <= diff.naivePixelCount
    ? null
    : `aligned ${diff.changedPixelCount} > naive ${diff.naivePixelCount}`;

const blocks400 = pageBlocks(400, 7);

const cases: Case[] = [
  {
    name: "tall page 1280x~14k, banner inserted at top",
    build: () => ({
      baseline: renderPage(1280, blocks400),
      current: renderPage(1280, [
        { kind: "box", height: 48, seed: 0, color: [250, 200, 60] },
        ...blocks400,
      ]),
    }),
    check: (diff) => expectAtMost(diff, 1280 * 60),
  },
  {
    name: "tall page, 30 blocks inserted at random places",
    build: () => {
      const random = rng(3);
      const current = [...blocks400];
      for (let insert = 0; insert < 30; insert++) {
        current.splice(Math.floor(random() * current.length), 0, {
          kind: "box",
          height: 30,
          seed: insert,
          color: [220, 40, 40],
        });
      }
      return { baseline: renderPage(1280, blocks400), current: renderPage(1280, current) };
    },
    check: (diff) => {
      const inserted = diff.regions.filter((region) => region.kind === "inserted").length;
      return inserted >= 25 && inserted <= 30
        ? expectAtMost(diff, 30 * 1100 * 40)
        : `${inserted} inserted regions`;
    },
  },
  {
    name: "tall page, 60 blocks removed",
    build: () => {
      const current = blocks400.filter((_, index) => index % 7 !== 3);
      return { baseline: renderPage(1280, blocks400), current: renderPage(1280, current) };
    },
    check: (diff) => expectAtMost(diff, 0),
  },
  {
    name: "tall page, 200 scattered in-place edits",
    build: () => {
      const current = blocks400.map((block, index) =>
        index % 2 === 0 && block.kind === "text" ? { ...block, seed: block.seed + 99_999 } : block,
      );
      return { baseline: renderPage(1280, blocks400), current: renderPage(1280, current) };
    },
    check: expectSameAsNaive,
  },
  {
    name: "tall page, sidebar 40px wider (horizontal shift everywhere)",
    build: () => ({
      baseline: renderPage(1280, blocks400),
      current: renderPage(1280, blocks400, { sidebar: 240, left: 260 }),
    }),
    check: (diff) =>
      diff.changedPixelCount < diff.naivePixelCount / 5
        ? null
        : `aligned ${diff.changedPixelCount} vs naive ${diff.naivePixelCount}`,
  },
  {
    name: "4K 3840x2160, banner inserted",
    build: () => {
      const blocks = pageBlocks(70, 11);
      return {
        baseline: renderPage(3840, blocks, { height: 2160 }),
        current: renderPage(
          3840,
          [{ kind: "box", height: 60, seed: 0, color: [250, 200, 60] }, ...blocks],
          {
            height: 2160,
          },
        ),
      };
    },
    check: (diff) => expectAtMost(diff, 3840 * 80),
  },
  {
    name: "pure noise vs different noise 1280x2000 (nothing aligns)",
    build: () => ({ baseline: noise(1280, 2000, 1), current: noise(1280, 2000, 2) }),
    check: expectSameAsNaive,
  },
  {
    name: "pure noise, 100 rows inserted in middle",
    build: () => {
      const baseline = noise(1280, 2000, 1);
      const insert = noise(1280, 100, 5);
      const data = new Uint8Array(1280 * 2100 * 4);
      data.set(baseline.data.subarray(0, 1280 * 1000 * 4));
      data.set(insert.data, 1280 * 1000 * 4);
      data.set(baseline.data.subarray(1280 * 1000 * 4), 1280 * 1100 * 4);
      return { baseline, current: { width: 1280, height: 2100, data } };
    },
    check: (diff) => expectAtMost(diff, 1280 * 100),
  },
  {
    name: "blank 1280x10000 page, one 10px dot",
    build: () => {
      const baseline = new Canvas(1280, 10_000);
      const current = new Canvas(1280, 10_000);
      current.fill(600, 5000, 10, 10, [255, 0, 0]);
      return { baseline: baseline.image(), current: current.image() };
    },
    check: (diff) =>
      diff.regions.length === 1 ? expectAtMost(diff, 100) : `${diff.regions.length} regions`,
  },
  {
    name: "2px stripes 1280x6000, shifted by 1 row (highly repetitive rows)",
    build: () => {
      const stripes = (offset: number) => {
        const canvas = new Canvas(1280, 6000);
        for (let y = offset; y < 6000; y += 2) {
          canvas.fill(0, y, 1280, 1, [0, 0, 0]);
        }
        return canvas.image();
      };
      return { baseline: stripes(0), current: stripes(1) };
    },
    check: (diff) => expectAtMost(diff, 1280 * 2),
  },
  {
    name: "half the rows rewritten, interleaved (large edit distance)",
    build: () => {
      const baseline = noise(1280, 4000, 1);
      const current = noise(1280, 4000, 1);
      const other = noise(1280, 4000, 9);
      for (let y = 0; y < 4000; y += 2) {
        current.data.set(other.data.subarray(y * 1280 * 4, (y + 1) * 1280 * 4), y * 1280 * 4);
      }
      return { baseline, current };
    },
    check: expectSameAsNaive,
  },
  {
    name: "anti-alias drift on 30% of pixels + banner (exact hashing breaks)",
    build: () => ({
      baseline: renderPage(1280, blocks400.slice(0, 120)),
      current: jitter(
        renderPage(1280, [
          { kind: "box", height: 48, seed: 0, color: [250, 200, 60] },
          ...blocks400.slice(0, 120),
        ]),
        4,
        0.3,
      ),
    }),
    check: () => null,
  },
  {
    name: "size changes in both dimensions (1280x3000 -> 1440x3400)",
    build: () => {
      const blocks = blocks400.slice(0, 100);
      return {
        baseline: renderPage(1280, blocks, { height: 3000 }),
        current: renderPage(
          1440,
          [{ kind: "box", height: 48, seed: 0, color: [250, 200, 60] }, ...blocks],
          {
            height: 3400,
          },
        ),
      };
    },
    check: () => null,
  },
  {
    name: "completely different pages 1280x~14k",
    build: () => ({
      baseline: renderPage(1280, blocks400),
      current: renderPage(1280, pageBlocks(400, 99)),
    }),
    check: () => null,
  },
];

const filter = process.argv[2];
const rows: string[] = [];
let failures = 0;
for (const testCase of cases.filter((candidate) => !filter || candidate.name.includes(filter))) {
  const { baseline, current } = testCase.build();
  globalThis.gc?.();
  const heapBefore = process.memoryUsage().heapUsed + process.memoryUsage().arrayBuffers;
  let peak = 0;
  const sampler = setInterval(() => {
    const usage = process.memoryUsage();
    peak = Math.max(peak, usage.heapUsed + usage.arrayBuffers - heapBefore);
  }, 5);
  const started = performance.now();
  const diff = alignedDiff(baseline, current);
  const elapsed = performance.now() - started;
  clearInterval(sampler);
  const usage = process.memoryUsage();
  peak = Math.max(peak, usage.heapUsed + usage.arrayBuffers - heapBefore);

  const naiveStarted = performance.now();
  alignedDiff(baseline, baseline);
  const identicalMs = performance.now() - naiveStarted;

  const failure = testCase.check(diff);
  failures += failure ? 1 : 0;
  rows.push(
    [
      failure ? "FAIL" : "ok  ",
      testCase.name.padEnd(66),
      `${current.width}x${current.height}`.padStart(10),
      `${elapsed.toFixed(0)}ms`.padStart(8),
      `identical ${identicalMs.toFixed(0)}ms`.padStart(16),
      `~${(peak / 1024 / 1024).toFixed(0)}MB`.padStart(7),
      `naive ${diff.naivePixelCount}`.padStart(16),
      `aligned ${diff.changedPixelCount}`.padStart(17),
      `regions ${diff.regions.length}`.padStart(12),
      failure ?? "",
    ].join("  "),
  );
  console.log(rows.at(-1));
}
console.log(failures === 0 ? "\nall cases ok" : `\n${failures} case(s) failed`);
process.exitCode = failures === 0 ? 0 : 1;
