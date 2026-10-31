// Captures each scenario several times through OVR's own capture code (newPage,
// disableLazyLoading, trackNetworkActivity, settlePage, takeScreenshot), each in a fresh browser
// context as a separate build would, and diffs every capture against the first with the same
// pixelmatch settings as compareImagesWorker. Then repeats with Playwright-style safeguards added.
//
//   apps/worker/node_modules/.bin/tsx packages/capture/flakiness-repro/repro.ts

import { mkdir, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pixelmatch from "pixelmatch";
import { chromium, type Browser, type Page } from "playwright";
import { PNG } from "pngjs";

import { newPage } from "@ovr/capture-browser/browser";
import { disableLazyLoading, takeScreenshot } from "@ovr/capture-browser/page";
import { settlePage, trackNetworkActivity } from "@ovr/capture-browser/settle";
import { SETTLE_TIMEOUT_MS } from "@ovr/capture-browser/timeouts";

import { scenarios, type Scenario } from "./scenarios";

// Same as compareImagesWorker and the CLI's default diffThreshold. diffPercent is 0-100.
const PIXELMATCH_THRESHOLD = 0.1;
const DEFAULT_DIFF_THRESHOLD = 0.05;

const RUNS = Number(process.env.RUNS ?? 6);
// Alternates a normal and a busy CPU, the way a worker's load varies from build to build.
const CPU_RATES = [1, 4];
const VIEWPORT = { width: 600, height: 340 };
const FIXED_TIME = new Date("2026-01-15T10:30:00Z");

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "out");

type Strategy = {
  name: string;
  applies: (scenario: Scenario) => boolean;
  beforeLoad?: (page: Page) => Promise<void>;
  screenshot: (page: Page, scenario: Scenario) => Promise<{ image: Buffer; note?: string }>;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Playwright's toHaveScreenshot loop: screenshot until two in a row are identical, backing off
// 0, 100, 250, 500, then 1000ms between attempts, within the expect timeout.
const STABILITY_INTERVALS_MS = [0, 100, 250, 500];
const STABILITY_TIMEOUT_MS = 5_000;

const stableScreenshot = async (page: Page) => {
  const deadline = Date.now() + STABILITY_TIMEOUT_MS;
  let previous: Buffer | undefined;
  for (let attempt = 0; ; attempt++) {
    await sleep(STABILITY_INTERVALS_MS[attempt] ?? 1_000);
    const image = await takeScreenshot(page, false);
    if (previous?.equals(image)) {
      return { image, note: `stable after ${attempt + 1} screenshots` };
    }
    if (Date.now() >= deadline) {
      return { image, note: `NOT stable after ${attempt + 1} screenshots (would fail)` };
    }
    previous = image;
  }
};

const strategies: Strategy[] = [
  {
    name: "ovr-today",
    applies: () => true,
    screenshot: async (page) => ({ image: await takeScreenshot(page, false) }),
  },
  {
    name: "+stability-loop",
    applies: () => true,
    screenshot: (page) => stableScreenshot(page),
  },
  {
    name: "+mask",
    applies: (scenario) => Boolean(scenario.mask),
    screenshot: async (page, scenario) => ({
      image: await page.screenshot({
        animations: "disabled",
        mask: (scenario.mask ?? []).map((selector) => page.locator(selector)),
      }),
    }),
  },
  {
    name: "+fixed-clock-and-seed",
    applies: (scenario) => Boolean(scenario.mask),
    beforeLoad: async (page) => {
      await page.clock.setFixedTime(FIXED_TIME);
      await page.addInitScript(() => {
        let seed = 42;
        Math.random = () => {
          seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
          return seed / 2_147_483_648;
        };
      });
    },
    screenshot: async (page) => ({ image: await takeScreenshot(page, false) }),
  },
];

const startServer = async (html: string) => {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return { origin: `http://127.0.0.1:${port}`, close: () => server.close() };
};

const capture = async (
  browser: Browser,
  origin: string,
  scenario: Scenario,
  strategy: Strategy,
  cpuRate: number,
) => {
  // Same context options as the worker's capture page.
  const context = await browser.newContext({ deviceScaleFactor: 1, viewport: VIEWPORT });
  try {
    const page = await newPage(context);
    await disableLazyLoading(page);
    await strategy.beforeLoad?.(page);

    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuRate });

    const activity = trackNetworkActivity(page);
    await page.goto(origin, { waitUntil: "load" });
    const settled = await settlePage(page, activity, SETTLE_TIMEOUT_MS);
    const result = await strategy.screenshot(page, scenario);
    activity.dispose();
    return { ...result, settled };
  } finally {
    await context.close();
  }
};

const diff = (a: Buffer, b: Buffer) => {
  const left = PNG.sync.read(a);
  const right = PNG.sync.read(b);
  const out = new PNG({ width: left.width, height: left.height });
  const pixels = pixelmatch(left.data, right.data, out.data, left.width, left.height, {
    threshold: PIXELMATCH_THRESHOLD,
    diffMask: true,
  });
  return {
    diffPercent: (pixels / (left.width * left.height)) * 100,
    image: PNG.sync.write(out),
  };
};

type Row = {
  scenario: string;
  strategy: string;
  needsReview: number;
  nonZero: number;
  maxDiffPercent: number;
  notes: string[];
};

const main = async () => {
  await rm(OUT_DIR, { recursive: true, force: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
  });
  const rows: Row[] = [];

  try {
    for (const scenario of scenarios) {
      const server = await startServer(scenario.html);
      try {
        for (const strategy of strategies.filter((s) => s.applies(scenario))) {
          const dir = path.join(OUT_DIR, scenario.name, strategy.name);
          await mkdir(dir, { recursive: true });

          const runs = [];
          for (let run = 0; run < RUNS; run++) {
            const cpuRate = CPU_RATES[run % CPU_RATES.length]!;
            const result = await capture(browser, server.origin, scenario, strategy, cpuRate);
            await writeFile(path.join(dir, `run${run}-cpu${cpuRate}x.png`), result.image);
            runs.push(result);
          }

          const row: Row = {
            scenario: scenario.name,
            strategy: strategy.name,
            needsReview: 0,
            nonZero: 0,
            maxDiffPercent: 0,
            notes: [...new Set(runs.map((r) => r.note).filter((n): n is string => Boolean(n)))],
          };
          for (let run = 1; run < runs.length; run++) {
            const result = diff(runs[0]!.image, runs[run]!.image);
            if (result.diffPercent > 0) {
              row.nonZero += 1;
              await writeFile(path.join(dir, `diff-run0-vs-run${run}.png`), result.image);
            }
            if (result.diffPercent > DEFAULT_DIFF_THRESHOLD) {
              row.needsReview += 1;
            }
            row.maxDiffPercent = Math.max(row.maxDiffPercent, result.diffPercent);
          }
          if (runs.some((r) => !r.settled)) {
            row.notes.push("settlePage reported unsettled on some runs");
          }
          rows.push(row);
          console.log(
            `${scenario.name.padEnd(28)} ${strategy.name.padEnd(22)} ` +
              `review ${row.needsReview}/${RUNS - 1}  any-diff ${row.nonZero}/${RUNS - 1}  ` +
              `max ${row.maxDiffPercent.toFixed(3)}%  ${row.notes.join("; ")}`,
          );
        }
      } finally {
        server.close();
      }
    }
  } finally {
    await browser.close();
  }

  await writeFile(path.join(OUT_DIR, "results.json"), JSON.stringify(rows, null, 2));
};

await main();
