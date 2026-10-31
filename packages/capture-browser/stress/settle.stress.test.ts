// Stress test for capture settling. Not part of the regular test suite: run it with
//   pnpm --filter @ovr/capture-browser stress
// Tunables (env): STRESS_WORKERS, STRESS_ROUNDS, STRESS_JITTER_MS, STRESS_CPU_BURNERS, STRESS_OUT.
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";

import { chromium, type Browser, type Page } from "playwright";
import { PNG } from "pngjs";
import { afterAll, beforeAll, expect, test } from "vitest";

import { newPage } from "../src/browser";
import { detectCaptureStrategy, type CaptureStrategy } from "../src/captureStrategies";
import { bootTargetPage, disableLazyLoading, takeScreenshot } from "../src/page";
import { settlePage, trackNetworkActivity } from "../src/settle";
import { RENDER_TIMEOUT_MS, SETTLE_TIMEOUT_MS } from "../src/timeouts";

const WORKERS = Number(process.env.STRESS_WORKERS ?? 4);
const ROUNDS = Number(process.env.STRESS_ROUNDS ?? 5);
const JITTER_MS = Number(process.env.STRESS_JITTER_MS ?? 600);
const CPU_BURNERS = Number(process.env.STRESS_CPU_BURNERS ?? 2);
const OUT_DIR = process.env.STRESS_OUT ?? "/tmp/ovr-stress";
const FONT_PATH =
  process.env.STRESS_FONT ?? "/usr/share/fonts/truetype/liberation/LiberationSerif-BoldItalic.ttf";

const VIEWPORT = { width: 800, height: 600 };

// The region a story's endless animation draws in, which is left out of the comparison.
const SPINNER = { x: 0, y: 0, width: 48, height: 48 };

const makePng = (
  width: number,
  height: number,
  pixel: (x: number, y: number, rand: () => number) => [number, number, number],
): Buffer => {
  let seed = width * 31 + height;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y, rand);
      const offset = (y * width + x) * 4;
      png.data[offset] = r;
      png.data[offset + 1] = g;
      png.data[offset + 2] = b;
      png.data[offset + 3] = 255;
    }
  }
  return PNG.sync.write(png);
};

// Each render gets fresh asset URLs, so nothing is served from the memory cache.
const STORIES: Record<string, string> = {
  // An image whose URL only arrives with data.
  "data-image": `
    fetch(asset("/api/data")).then((r) => r.json()).then(() => {
      const img = document.createElement("img");
      img.src = asset("/img/photo.png");
      img.width = 600; img.height = 400;
      root.append(img);
    });`,
  // Large enough to take a while to decode.
  "large-image": `
    root.innerHTML = '<img width="760" height="532" src="' + asset("/img/big.png") + '">';`,
  "css-background": `
    root.innerHTML = '<div style="width:600px;height:400px;background:url(' + asset("/img/photo.png") + ') center/cover"></div>';`,
  "web-font": `
    const family = "StressFont" + renderCount;
    const style = document.createElement("style");
    style.textContent = "@font-face{font-family:" + family + ";src:url(" + asset("/font.ttf") + ");font-display:swap}";
    root.append(style);
    const p = document.createElement("p");
    p.style.cssText = "font:48px " + family + ", monospace";
    p.textContent = "The quick brown fox";
    root.append(p);`,
  // An endless JS animation keeps the DOM changing while an image loads.
  "spinner-then-image": `
    const spinner = document.createElement("div");
    spinner.style.cssText = "position:absolute;left:8px;top:8px;width:32px;height:32px;background:#c00";
    root.append(spinner);
    let angle = 0;
    const spin = () => { if (!spinner.isConnected) return; spinner.style.transform = "rotate(" + (angle += 7) + "deg)"; requestAnimationFrame(spin); };
    spin();
    fetch(asset("/api/data")).then((r) => r.json()).then(() => {
      const img = document.createElement("img");
      img.src = asset("/img/photo.png");
      img.style.cssText = "position:absolute;left:100px;top:100px";
      root.append(img);
    });`,
  // Like the above, but the image only starts loading a moment after the data arrives, as it
  // would behind a debounce or a second render.
  "spinner-delayed-image": `
    const spinner = document.createElement("div");
    spinner.style.cssText = "position:absolute;left:8px;top:8px;width:32px;height:32px;background:#c00";
    root.append(spinner);
    let angle = 0;
    const spin = () => { if (!spinner.isConnected) return; spinner.style.transform = "rotate(" + (angle += 7) + "deg)"; requestAnimationFrame(spin); };
    spin();
    fetch(asset("/api/data")).then((r) => r.json()).then(() => new Promise((r) => setTimeout(r, 300))).then(() => {
      const img = document.createElement("img");
      img.src = asset("/img/photo.png");
      img.style.cssText = "position:absolute;left:100px;top:100px";
      root.append(img);
    });`,
  // A component that fades its image in once it loads.
  "fade-in": `
    root.innerHTML = '<style>.fade{opacity:0;transition:opacity .4s}.fade.loaded{opacity:1}</style>';
    const img = document.createElement("img");
    img.className = "fade";
    img.onload = () => img.classList.add("loaded");
    img.src = asset("/img/photo.png");
    root.append(img);`,
  // A JS tween like the ones animation libraries run, started when the image loads.
  "js-tween": `
    const img = document.createElement("img");
    img.style.opacity = "0";
    img.onload = () => {
      const start = performance.now();
      const step = (now) => { const t = Math.min((now - start) / 400, 1); img.style.opacity = String(t); if (t < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    img.src = asset("/img/photo.png");
    root.append(img);`,
  "image-grid": `
    root.style.cssText = "display:grid;grid-template-columns:repeat(8,64px);gap:4px";
    for (let i = 0; i < 40; i++) {
      const img = document.createElement("img");
      img.width = 64; img.height = 64;
      img.src = asset("/img/tile-" + (i % 10) + ".png");
      root.append(img);
    }`,
};

const IFRAME_HTML = `<!doctype html>
<html>
  <head><style>body{margin:0;font:16px sans-serif}#storybook-root{position:relative}</style></head>
  <body>
    <div id="storybook-root"></div>
    <script>
      const listeners = {};
      const channel = {
        on: (e, l) => { (listeners[e] ??= new Set()).add(l); },
        off: (e, l) => { listeners[e]?.delete(l); },
        emit: (e, payload) => {
          if (e === "setCurrentStory") { setTimeout(() => render(payload.storyId)); return; }
          for (const l of [...(listeners[e] ?? [])]) l(payload);
        },
      };
      const stories = { ${Object.entries(STORIES)
        .map(([id, body]) => `${JSON.stringify(id)}: (root, asset, renderCount) => { ${body} }`)
        .join(",\n")} };
      let renderCount = 0;
      const render = (storyId) => {
        const old = document.getElementById("storybook-root");
        const root = document.createElement("div");
        root.id = "storybook-root";
        old.replaceWith(root);
        renderCount++;
        const asset = (url) => url + (url.includes("?") ? "&" : "?") + "r=" + renderCount + "-" + Math.random();
        stories[storyId](root, asset, renderCount);
        setTimeout(() => {
          channel.emit("storyRendered", storyId);
          channel.emit("storyFinished", { storyId, status: "success" });
        });
      };
      window.__STORYBOOK_ADDONS_CHANNEL__ = channel;
    </script>
  </body>
</html>`;

type Assets = Record<string, { type: string; body: Buffer }>;

const buildAssets = async (): Promise<Assets> => {
  const assets: Assets = {
    "/iframe.html": { type: "text/html", body: Buffer.from(IFRAME_HTML) },
    "/api/data": { type: "application/json", body: Buffer.from('{"ok":true}') },
    "/font.ttf": { type: "font/ttf", body: await readFile(FONT_PATH) },
    "/img/photo.png": {
      type: "image/png",
      body: makePng(600, 400, (x, y, rand) => [
        (x * 255) / 600,
        (y * 255) / 400,
        Math.floor(rand() * 255),
      ]),
    },
    "/img/big.png": {
      type: "image/png",
      body: makePng(2400, 1680, (x, y, rand) => [
        Math.floor(rand() * 255),
        (x ^ y) & 255,
        Math.floor(rand() * 255),
      ]),
    },
  };
  for (let i = 0; i < 10; i++) {
    assets[`/img/tile-${i}.png`] = {
      type: "image/png",
      body: makePng(64, 64, (x, y) => [i * 25, (x * 4) & 255, (y * 4) & 255]),
    };
  }
  return assets;
};

type Server = { origin: string; close: () => void; jitterMs: number };

const startServer = async (assets: Assets): Promise<Server> => {
  const state: Server = { origin: "", close: () => {}, jitterMs: 0 };
  const server = http.createServer((req, res) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    const asset = assets[pathname];
    if (!asset) {
      res.writeHead(404);
      res.end();
      return;
    }
    const delay = pathname === "/iframe.html" ? 0 : Math.random() * state.jitterMs;
    setTimeout(() => {
      res.writeHead(200, { "Content-Type": asset.type, "Cache-Control": "no-store" });
      res.end(asset.body);
    }, delay);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  state.origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  state.close = () => {
    server.closeAllConnections();
    server.close();
  };
  return state;
};

const capture = async (
  page: Page,
  strategy: CaptureStrategy,
  activity: ReturnType<typeof trackNetworkActivity>,
  storyId: string,
  extraWaitMs = 0,
) => {
  const startedAt = performance.now();
  const render = await page.evaluate(strategy.waitForTargetPlayed, {
    targetId: storyId,
    timeoutMs: RENDER_TIMEOUT_MS,
  });
  const settled = render.ok ? await settlePage(page, activity, SETTLE_TIMEOUT_MS) : false;
  if (extraWaitMs > 0) {
    await page.waitForTimeout(extraWaitMs);
  }
  const screenshot = await takeScreenshot(page, false);
  return { render, settled, screenshot, ms: Math.round(performance.now() - startedAt) };
};

const openCapturePage = async (browser: Browser, origin: string, strategy: CaptureStrategy) => {
  const page = await newPage(await browser.newContext({ deviceScaleFactor: 1 }));
  await disableLazyLoading(page);
  await page.setViewportSize(VIEWPORT);
  await bootTargetPage(page, origin, strategy);
  return { page, activity: trackNetworkActivity(page) };
};

const differingPixels = (a: Buffer, b: Buffer): number => {
  const left = PNG.sync.read(a);
  const right = PNG.sync.read(b);
  if (left.width !== right.width || left.height !== right.height) {
    return Number.POSITIVE_INFINITY;
  }
  let count = 0;
  for (let y = 0; y < left.height; y++) {
    for (let x = 0; x < left.width; x++) {
      if (
        x >= SPINNER.x &&
        x < SPINNER.x + SPINNER.width &&
        y >= SPINNER.y &&
        y < SPINNER.y + SPINNER.height
      ) {
        continue;
      }
      const offset = (y * left.width + x) * 4;
      if (
        left.data[offset] !== right.data[offset] ||
        left.data[offset + 1] !== right.data[offset + 1] ||
        left.data[offset + 2] !== right.data[offset + 2]
      ) {
        count++;
      }
    }
  }
  return count;
};

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
};

let server: Server;
let strategy: CaptureStrategy;
const burners: ChildProcess[] = [];

beforeAll(async () => {
  await mkdir(OUT_DIR, { recursive: true });
  server = await startServer(await buildAssets());
  const markers = path.join(OUT_DIR, "bundle");
  await mkdir(markers, { recursive: true });
  await writeFile(path.join(markers, "index.json"), JSON.stringify({ v: 5, entries: {} }));
  await writeFile(
    path.join(markers, "project.json"),
    JSON.stringify({ storybookVersion: "10.5.10" }),
  );
  strategy = await detectCaptureStrategy(markers);
});

afterAll(() => {
  for (const burner of burners) {
    burner.kill("SIGKILL");
  }
  server?.close();
});

test("captures match their golden screenshots under load", async () => {
  const storyIds = Object.keys(STORIES);

  // Golden screenshots: no jitter, no load, and a long wait before each one.
  const goldens = new Map<string, Buffer>();
  {
    const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
    const { page, activity } = await openCapturePage(browser, server.origin, strategy);
    for (const storyId of storyIds) {
      const { screenshot } = await capture(page, strategy, activity, storyId, 3_000);
      goldens.set(storyId, screenshot);
      await writeFile(path.join(OUT_DIR, `golden-${storyId}.png`), screenshot);
    }
    await browser.close();
  }

  server.jitterMs = JITTER_MS;
  for (let i = 0; i < CPU_BURNERS; i++) {
    burners.push(spawn("sh", ["-c", "while :; do :; done"], { stdio: "ignore" }));
  }

  type Result = { storyId: string; settled: boolean; diff: number; ms: number };
  const results: Result[] = [];

  await Promise.all(
    Array.from({ length: WORKERS }, async (_, worker) => {
      const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
      try {
        const { page, activity } = await openCapturePage(browser, server.origin, strategy);
        for (let round = 0; round < ROUNDS; round++) {
          for (const storyId of shuffle(storyIds)) {
            const { settled, screenshot, ms } = await capture(page, strategy, activity, storyId);
            const diff = differingPixels(goldens.get(storyId)!, screenshot);
            results.push({ storyId, settled, diff, ms });
            if (diff > 0) {
              await writeFile(
                path.join(OUT_DIR, `fail-${storyId}-w${worker}-r${round}.png`),
                screenshot,
              );
            }
          }
        }
      } finally {
        await browser.close();
      }
    }),
  );

  const summary = storyIds.map((storyId) => {
    const runs = results.filter((result) => result.storyId === storyId);
    const failures = runs.filter((result) => result.diff > 0);
    const ms = runs.map((result) => result.ms).sort((a, b) => a - b);
    return {
      storyId,
      runs: runs.length,
      failures: failures.length,
      unsettled: runs.filter((result) => !result.settled).length,
      unsettledFailures: failures.filter((result) => !result.settled).length,
      p50Ms: ms[Math.floor(ms.length / 2)],
      maxMs: ms.at(-1),
    };
  });
  console.table(summary);
  await writeFile(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  expect(summary.filter((row) => row.failures > 0)).toEqual([]);
}, 1_800_000);
