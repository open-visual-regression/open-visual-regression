import pixelmatch from "pixelmatch";
import { test } from "vitest";

import { alignedDiff } from "../alignedDiff";
import { PIXEL_THRESHOLD } from "../masks";
import type { Image } from "../types";
import {
  BANNER,
  noise,
  randomBlocks,
  renderPage,
  seededRandom,
  type Block,
} from "./syntheticPages";

// Each case times the aligned diff next to a plain pixelmatch of the same
// images, so the cost of aligning is easy to read off. A single diff of a big
// page takes seconds, so a few iterations are plenty.
const OPTIONS = { iterations: 3, time: 0, warmupIterations: 1, warmupTime: 0 };
const TIMEOUT = 5 * 60_000;

type Case = {
  name: string;
  baseline: Image;
  current: Image;
};

const plainPixelmatch = (baseline: Image, current: Image) => {
  const width = Math.max(baseline.width, current.width);
  const height = Math.max(baseline.height, current.height);
  const pad = (image: Image) => {
    if (image.width === width && image.height === height) {
      return image.data;
    }
    const data = new Uint8Array(width * height * 4);
    for (let row = 0; row < image.height; row++) {
      data.set(
        image.data.subarray(row * image.width * 4, (row + 1) * image.width * 4),
        row * width * 4,
      );
    }
    return data;
  };
  return pixelmatch(pad(baseline), pad(current), undefined, width, height, {
    threshold: PIXEL_THRESHOLD,
  });
};

const tallPage = randomBlocks(400, 7);

const withInsertions = (blocks: Block[], count: number): Block[] => {
  const random = seededRandom(3);
  return Array.from({ length: count }).reduce<Block[]>((page) => {
    const at = Math.floor(random() * page.length);
    return [
      ...page.slice(0, at),
      { kind: "box", height: 30, color: [220, 40, 40] },
      ...page.slice(at),
    ];
  }, blocks);
};

const interleaved = (baseline: Image, other: Image): Image => {
  const data = baseline.data.slice();
  const rowBytes = baseline.width * 4;
  for (let row = 0; row < baseline.height; row += 2) {
    data.set(other.data.subarray(row * rowBytes, (row + 1) * rowBytes), row * rowBytes);
  }
  return { ...baseline, data };
};

// Pages that look like real screenshots, with the edits a review usually sees.
const typicalCases: Case[] = [
  {
    name: "banner at the top of a 1280×18k page",
    baseline: renderPage(1280, tallPage),
    current: renderPage(1280, [BANNER, ...tallPage]),
  },
  {
    name: "30 blocks inserted through a 1280×19k page",
    baseline: renderPage(1280, tallPage),
    current: renderPage(1280, withInsertions(tallPage, 30)),
  },
  {
    name: "60 blocks removed from a 1280×18k page",
    baseline: renderPage(1280, tallPage),
    current: renderPage(
      1280,
      tallPage.filter((_, index) => index % 7 !== 3),
    ),
  },
  {
    name: "200 lines rewritten in place on a 1280×18k page",
    baseline: renderPage(1280, tallPage),
    current: renderPage(
      1280,
      tallPage.map((block, index) =>
        block.kind === "text" && index % 2 === 0 ? { ...block, seed: block.seed + 99_999 } : block,
      ),
    ),
  },
  {
    name: "sidebar 40px wider on a 1280×18k page",
    baseline: renderPage(1280, tallPage),
    current: renderPage(1280, tallPage, { sidebarWidth: 240 }),
  },
  {
    name: "banner on a 3840×2160 viewport",
    baseline: renderPage(3840, randomBlocks(70, 11), { height: 2160 }),
    current: renderPage(3840, [BANNER, ...randomBlocks(70, 11)], { height: 2160 }),
  },
];

// Inputs built to stress the alignment: nothing lines up, or almost every row
// is an edit, or the same row repeats thousands of times.
const worstCases: Case[] = [
  {
    name: "unrelated pages 1280×18k",
    baseline: renderPage(1280, tallPage),
    current: renderPage(1280, randomBlocks(400, 99)),
  },
  {
    name: "noise against different noise 1280×2000",
    baseline: noise(1280, 2000, 1),
    current: noise(1280, 2000, 2),
  },
  {
    name: "every other row rewritten 1280×4000",
    baseline: noise(1280, 4000, 1),
    current: interleaved(noise(1280, 4000, 1), noise(1280, 4000, 9)),
  },
  {
    name: "blank 1280×10k page with one dot",
    baseline: renderPage(1280, [], { height: 10_000 }),
    current: renderPage(1280, [{ kind: "gap", height: 5000 }, BANNER], { height: 10_000 }),
  },
];

const benchCases = (cases: Case[]) => {
  for (const { name, baseline, current } of cases) {
    test(name, { timeout: TIMEOUT }, async ({ bench }) => {
      await bench.compare(
        bench("alignedDiff", () => {
          alignedDiff(baseline, current);
        }),
        bench("plain pixelmatch", () => {
          plainPixelmatch(baseline, current);
        }),
        OPTIONS,
      );
    });
  }
};

benchCases(typicalCases);
benchCases(worstCases);
