// Runs alignedDiff against real Storybook stories. Each story is shot once as
// a baseline, then again after a known DOM mutation; both diffs are scored by
// how many flagged pixels fall outside the area the mutation really changed.
//
//   pnpm --filter @ovr/ui build-storybook && pnpm --filter web build-storybook
//   pnpm dlx tsx scripts/storybookBenchmark.ts <out-dir> [storybook-static ...]
//
// Set CHROMIUM_PATH to use a system browser.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import pixelmatch from "pixelmatch";
import { chromium, type Page } from "playwright";
import { PNG } from "pngjs";

import { alignedDiff } from "../src/alignedDiff";
import { renderDiff } from "../src/renderDiff";
import type { Image, Rect } from "../src/types";

const decodePng = (buffer: Buffer): Image => {
  const png = PNG.sync.read(buffer);
  return { width: png.width, height: png.height, data: png.data };
};

const outDir = resolve(process.argv[2] ?? "storybook-diff-report");
const builds = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ["../ui/storybook-static", "../../apps/web/storybook-static"];
const CONCURRENCY = 4;
const OUTSIDE_MARGIN = 6;

type Mutation = {
  name: string;
  /** Runs in the page; returns the rects the change is expected to touch, or null to skip. */
  apply: string;
};

// Each mutation is a function body evaluated in the story iframe. Helpers
// `root`, `candidates()` and `rectOf(el)` are defined by PRELUDE.
const PRELUDE = `
  const root = document.querySelector("#storybook-root") ?? document.body;
  const rectOf = (el) => { const r = el.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; };
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 8 && r.height > 8 && s.visibility !== "hidden" && s.display !== "none"; };
  const candidates = () => [...root.querySelectorAll("*")].filter((el) => visible(el) && el.getBoundingClientRect().height < 400 && !["svg","path","g","circle","rect","line","polyline"].includes(el.tagName.toLowerCase()));
  const textLeaves = () => [...root.querySelectorAll("*")].filter((el) => visible(el) && el.children.length === 0 && (el.textContent ?? "").trim().length >= 4);
`;

const mutations: Mutation[] = [
  { name: "no-change", apply: "return [];" },
  {
    name: "insert-top",
    apply: `
      const target = root.firstElementChild ?? root;
      const banner = document.createElement("div");
      banner.textContent = "Inserted announcement banner";
      banner.style.cssText = "height:40px;background:#f59e0b;color:#111;font:14px sans-serif;display:flex;align-items:center;padding:0 12px";
      target.prepend(banner);
      return [rectOf(banner)];`,
  },
  {
    name: "shift-down",
    apply: `root.style.paddingTop = (parseFloat(getComputedStyle(root).paddingTop) + 24) + "px"; return [];`,
  },
  {
    name: "shift-right",
    apply: `root.style.paddingLeft = (parseFloat(getComputedStyle(root).paddingLeft) + 30) + "px"; return [];`,
  },
  {
    name: "text-edit",
    apply: `
      const leaves = textLeaves();
      if (leaves.length === 0) return null;
      const leaf = leaves[Math.floor(leaves.length / 2)];
      leaf.textContent = leaf.textContent + " edited";
      return [rectOf(leaf.parentElement ?? leaf)];`,
  },
  {
    name: "hide-element",
    apply: `
      const all = candidates().filter((el) => el.getBoundingClientRect().height >= 16);
      if (all.length < 3) return null;
      const target = all[Math.floor(all.length / 2)];
      // Where the element was is the expected change; content that moved up
      // to fill the space is not.
      const before = rectOf(target);
      target.style.display = "none";
      return [before];`,
  },
  {
    name: "recolor",
    apply: `
      const all = candidates();
      if (all.length === 0) return null;
      const el = all[Math.floor(all.length / 2)];
      el.style.setProperty("background-color", "#fde68a", "important");
      return [rectOf(el)];`,
  },
];

// Comma-separated mutation names to run, e.g. MUTATIONS=hide-element.
const onlyMutations = process.env.MUTATIONS?.split(",");
const selectedMutations = mutations.filter(
  (mutation) =>
    !onlyMutations || mutation.name === "no-change" || onlyMutations.includes(mutation.name),
);

const STABILIZE = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`;

const serve = (dir: string, port: number) =>
  spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: dir,
    stdio: "ignore",
  });

const shoot = async (
  page: Page,
  url: string,
  mutation: Mutation | null,
): Promise<{ png: Buffer; rects: Rect[] | null }> => {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: STABILIZE });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const rects = mutation
    ? ((await page.evaluate(`(() => { ${PRELUDE} ${mutation.apply} })()`)) as Rect[] | null)
    : [];
  await page.waitForTimeout(50);
  return { png: await page.screenshot({ fullPage: true }), rects };
};

/** Changed pixels in `mask` (current-image space) outside the expected rects. */
const outside = (mask: Uint8Array, width: number, rects: Rect[]): number => {
  let count = 0;
  const height = mask.length / width;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y * width + x]) {
        continue;
      }
      const inside = rects.some(
        (rect) =>
          x >= rect.x - OUTSIDE_MARGIN &&
          x < rect.x + rect.width + OUTSIDE_MARGIN &&
          y >= rect.y - OUTSIDE_MARGIN &&
          y < rect.y + rect.height + OUTSIDE_MARGIN,
      );
      count += inside ? 0 : 1;
    }
  }
  return count;
};

const pad = (image: Image, width: number, height: number) => {
  const data = new Uint8Array(width * height * 4);
  for (let row = 0; row < image.height; row++) {
    data.set(
      image.data.subarray(row * image.width * 4, (row + 1) * image.width * 4),
      row * width * 4,
    );
  }
  return data;
};

const naiveMask = (baseline: Image, current: Image) => {
  const width = Math.max(baseline.width, current.width);
  const height = Math.max(baseline.height, current.height);
  const output = new Uint8Array(width * height * 4);
  pixelmatch(pad(baseline, width, height), pad(current, width, height), output, width, height, {
    threshold: 0.1,
    diffMask: true,
    diffColor: [255, 0, 0],
  });
  const mask = new Uint8Array(width * height);
  let count = 0;
  for (let index = 0; index < mask.length; index++) {
    mask[index] = output[index * 4 + 3] !== 0 && output[index * 4 + 1] === 0 ? 1 : 0;
    count += mask[index]!;
  }
  return { mask, width, height, output, count };
};

const sideBySide = (images: Image[]): Buffer => {
  const gap = 12;
  const width = images.reduce((sum, image) => sum + image.width, 0) + gap * (images.length - 1);
  const height = Math.max(...images.map((image) => image.height));
  const png = new PNG({ width, height });
  png.data.fill(255);
  let offsetX = 0;
  for (const image of images) {
    for (let row = 0; row < image.height; row++) {
      png.data.set(
        image.data.subarray(row * image.width * 4, (row + 1) * image.width * 4),
        (row * width + offsetX) * 4,
      );
    }
    offsetX += image.width + gap;
  }
  return PNG.sync.write(png);
};

type Result = {
  story: string;
  mutation: string;
  size: string;
  naive: number;
  aligned: number;
  naiveOutside: number;
  alignedOutside: number;
  regions: number;
  ms: number;
  flaky: boolean;
  error?: string;
};

const main = async () => {
  mkdirSync(join(outDir, "images"), { recursive: true });
  const servers = builds.map((dir, index) => ({
    dir: resolve(dir),
    port: 6100 + index,
    process: serve(resolve(dir), 6100 + index),
  }));
  await new Promise((done) => setTimeout(done, 1000));

  const jobs = servers.flatMap(({ dir, port }) => {
    const index = JSON.parse(readFileSync(join(dir, "index.json"), "utf8")) as {
      entries: Record<string, { id: string; type: string }>;
    };
    return Object.values(index.entries)
      .filter((entry) => entry.type === "story")
      .map((entry) => ({
        id: entry.id,
        url: `http://127.0.0.1:${port}/iframe.html?id=${entry.id}&viewMode=story`,
      }));
  });

  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const results: Result[] = [];
  let next = 0;
  const worker = async () => {
    const page = await browser.newPage({
      viewport: { width: 1024, height: 768 },
      deviceScaleFactor: 1,
    });
    while (next < jobs.length) {
      const job = jobs[next++]!;
      let baseline: Image;
      try {
        baseline = decodePng((await shoot(page, job.url, null)).png);
      } catch (error) {
        results.push({
          story: job.id,
          mutation: "baseline",
          size: "",
          naive: 0,
          aligned: 0,
          naiveOutside: 0,
          alignedOutside: 0,
          regions: 0,
          ms: 0,
          flaky: false,
          error: String(error).slice(0, 120),
        });
        continue;
      }
      let flaky = false;
      for (const mutation of selectedMutations) {
        try {
          const shot = await shoot(page, job.url, mutation);
          if (shot.rects === null) {
            continue;
          }
          const current = decodePng(shot.png);
          const started = performance.now();
          const diff = alignedDiff(baseline, current);
          const ms = performance.now() - started;
          const naive = naiveMask(baseline, current);
          if (mutation.name === "no-change") {
            flaky = naive.count > 0;
          }
          const result: Result = {
            story: job.id,
            mutation: mutation.name,
            size: `${current.width}x${current.height}`,
            naive: naive.count,
            aligned: diff.changedPixelCount,
            naiveOutside: outside(naive.mask, naive.width, shot.rects),
            alignedOutside: outside(diff.mask, diff.width, shot.rects),
            regions: diff.regions.length,
            ms: Math.round(ms),
            flaky,
          };
          results.push(result);
          if (result.naive > 0 && mutation.name !== "no-change") {
            writeFileSync(
              join(outDir, "images", `${job.id}--${mutation.name}.png`),
              sideBySide([
                baseline,
                current,
                { width: naive.width, height: naive.height, data: naive.output },
                renderDiff(current, diff),
              ]),
            );
          }
        } catch (error) {
          results.push({
            story: job.id,
            mutation: mutation.name,
            size: "",
            naive: 0,
            aligned: 0,
            naiveOutside: 0,
            alignedOutside: 0,
            regions: 0,
            ms: 0,
            flaky,
            error: String(error).slice(0, 120),
          });
        }
      }
      process.stdout.write(`\r${next}/${jobs.length} stories`);
    }
    await page.close();
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close();
  for (const server of servers) {
    server.process.kill();
  }

  writeFileSync(join(outDir, "results.json"), JSON.stringify(results, null, 2));
  summarize(results);
};

const summarize = (results: Result[]) => {
  const flakyStories = new Set(
    results.filter((result) => result.flaky).map((result) => result.story),
  );
  const errors = results.filter((result) => result.error);
  console.log(
    `\n\n${new Set(results.map((result) => result.story)).size} stories, ${flakyStories.size} flaky (excluded), ${errors.length} errors`,
  );
  const rows = results.filter((result) => !result.error && !flakyStories.has(result.story));
  console.log(
    [
      "mutation".padEnd(14),
      "shots",
      "changed",
      "naive px",
      "aligned px",
      "naive outside",
      "aligned outside",
      "aligned<=naive",
      "median ms",
      "max ms",
    ].join("  "),
  );
  for (const mutation of selectedMutations) {
    const group = rows.filter((result) => result.mutation === mutation.name);
    if (group.length === 0) {
      continue;
    }
    const sum = (pick: (result: Result) => number) =>
      group.reduce((total, result) => total + pick(result), 0);
    const times = group.map((result) => result.ms).sort((a, b) => a - b);
    console.log(
      [
        mutation.name.padEnd(14),
        String(group.length).padStart(5),
        String(group.filter((result) => result.naive > 0).length).padStart(7),
        String(sum((result) => result.naive)).padStart(8),
        String(sum((result) => result.aligned)).padStart(10),
        String(sum((result) => result.naiveOutside)).padStart(13),
        String(sum((result) => result.alignedOutside)).padStart(15),
        `${group.filter((result) => result.aligned <= result.naive).length}/${group.length}`.padStart(
          14,
        ),
        String(times[Math.floor(times.length / 2)]).padStart(9),
        String(times.at(-1)).padStart(6),
      ].join("  "),
    );
  }
  const worse = rows
    .filter((result) => result.alignedOutside > result.naiveOutside)
    .sort((a, b) => b.alignedOutside - b.naiveOutside - (a.alignedOutside - a.naiveOutside));
  console.log(
    `\n${worse.length} shots where aligned flags more pixels outside the change than naive:`,
  );
  for (const result of worse.slice(0, 15)) {
    console.log(
      `  ${result.story} ${result.mutation}: naive outside ${result.naiveOutside}, aligned outside ${result.alignedOutside}`,
    );
  }
  for (const error of errors.slice(0, 5)) {
    console.log(`  error ${error.story} ${error.mutation}: ${error.error}`);
  }
};

await main();
