import { copyFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll } from "vitest";

import { detectCaptureStrategy, type CaptureStrategy } from "../captureStrategies";
import { describe, expect, test, withCapturePage, writeStorybookBuildMarkers } from "./fixtures";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));

const BOOT_TIMEOUT_MS = 10_000;
const RENDER_TIMEOUT_MS = 5_000;

let bundleDir: string;
let strategy: CaptureStrategy;

beforeAll(async () => {
  bundleDir = await mkdtemp(path.join(tmpdir(), "ovr-capture-strategy-"));
  await copyFile(
    path.join(TEST_DIR, "html/iframe-static.html"),
    path.join(bundleDir, "iframe.html"),
  );
  await writeStorybookBuildMarkers(bundleDir);

  strategy = await detectCaptureStrategy(bundleDir);
});

afterAll(async () => {
  await rm(bundleDir, { recursive: true, force: true });
});

describe("storybook capture strategy", () => {
  test("re-renders a story Storybook reports as unchanged", async () => {
    await withCapturePage(bundleDir, async (page) => {
      await strategy.waitForBoot(page, BOOT_TIMEOUT_MS);

      const first = await page.evaluate(strategy.waitForTargetPlayed, {
        targetId: "story-a",
        timeoutMs: RENDER_TIMEOUT_MS,
      });
      expect(first).toEqual({ ok: true });
      expect(await page.textContent("#storybook-root")).toBe("rendered: story-a #1");

      const second = await page.evaluate(strategy.waitForTargetPlayed, {
        targetId: "story-a",
        timeoutMs: RENDER_TIMEOUT_MS,
      });
      expect(second).toEqual({ ok: true });
      expect(await page.textContent("#storybook-root")).toBe("rendered: story-a #2");
    });
  }, 30_000);
});
