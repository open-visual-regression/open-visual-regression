import { copyFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { detectCaptureStrategy, type CaptureStrategy } from "../captureStrategies";
import { newPage } from "../lib/browser";
import { startStaticProxy, type StaticProxy } from "../lib/staticProxy";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));

const BOOT_TIMEOUT_MS = 10_000;
const RENDER_TIMEOUT_MS = 5_000;

let browser: Browser;
let bundleDir: string;
let proxy: StaticProxy;
let strategy: CaptureStrategy;

beforeAll(async () => {
  bundleDir = await mkdtemp(path.join(tmpdir(), "ovr-capture-strategy-"));
  await copyFile(
    path.join(TEST_DIR, "html/iframe-static.html"),
    path.join(bundleDir, "iframe.html"),
  );
  await writeFile(path.join(bundleDir, "index.json"), JSON.stringify({ v: 5, entries: {} }));
  await writeFile(
    path.join(bundleDir, "project.json"),
    JSON.stringify({ storybookVersion: "10.5.10" }),
  );

  strategy = await detectCaptureStrategy(bundleDir);
  proxy = await startStaticProxy(bundleDir);
  browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
});

afterAll(async () => {
  await browser?.close();
  proxy?.close();
  await rm(bundleDir, { recursive: true, force: true });
});

const bootedPage = async () => {
  const page = await newPage(await browser.newContext());
  await page.goto(`${proxy.origin}/iframe.html`, { waitUntil: "load" });
  await strategy.waitForBoot(page, BOOT_TIMEOUT_MS);
  return page;
};

const renderedText = (page: Awaited<ReturnType<typeof bootedPage>>) =>
  page.textContent("#storybook-root");

describe("storybook capture strategy", () => {
  test("re-renders a story Storybook reports as unchanged, rather than passing it straight through", async () => {
    const page = await bootedPage();

    const first = await page.evaluate(strategy.waitForTargetPlayed, {
      targetId: "story-a",
      timeoutMs: RENDER_TIMEOUT_MS,
    });
    expect(first).toEqual({ ok: true });
    expect(await renderedText(page)).toBe("rendered: story-a #1");

    const second = await page.evaluate(strategy.waitForTargetPlayed, {
      targetId: "story-a",
      timeoutMs: RENDER_TIMEOUT_MS,
    });
    expect(second).toEqual({ ok: true });
    expect(await renderedText(page)).toBe("rendered: story-a #2");
  }, 30_000);

  test("re-renders an unchanged story when waiting on the render event alone", async () => {
    const page = await bootedPage();

    await page.evaluate(strategy.waitForTargetRendered, {
      targetId: "story-b",
      timeoutMs: RENDER_TIMEOUT_MS,
    });

    const second = await page.evaluate(strategy.waitForTargetRendered, {
      targetId: "story-b",
      timeoutMs: RENDER_TIMEOUT_MS,
    });

    expect(second).toEqual({ ok: true });
    expect(await renderedText(page)).toBe("rendered: story-b #2");
  }, 30_000);

  test("still renders a story that was not already current", async () => {
    const page = await bootedPage();

    await page.evaluate(strategy.waitForTargetPlayed, {
      targetId: "story-a",
      timeoutMs: RENDER_TIMEOUT_MS,
    });

    const other = await page.evaluate(strategy.waitForTargetPlayed, {
      targetId: "story-b",
      timeoutMs: RENDER_TIMEOUT_MS,
    });

    expect(other).toEqual({ ok: true });
    expect(await renderedText(page)).toBe("rendered: story-b #2");
  }, 30_000);
});
