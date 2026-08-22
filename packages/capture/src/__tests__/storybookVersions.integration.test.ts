import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Browser, Page } from "playwright";
import { chromium } from "playwright";
import * as tar from "tar";
import { afterAll, beforeAll } from "vitest";

import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";
import { availableStorybookFixtures, type StorybookFixture } from "@ovr/storybook-compat/fixtures";
import { readStoryTargets } from "@ovr/storybook-compat/manifest";
import {
  assertSupportedStorybookBuild,
  readStorybookBuildVersion,
} from "@ovr/storybook-compat/version";

import { detectCaptureStrategy } from "../captureStrategies";
import { extractBuild } from "../extract";
import { newPage } from "../lib/browser";
import { startStaticProxy, type StaticProxy } from "../lib/staticProxy";
import { captureBuildGroup } from "../snapshots";
import { readStoryParameterOverrides } from "../storyViewports";
import { describe, expect, test as baseTest } from "./fixtures";

const STORY_IDS = {
  default: "components-button--default",
  withOvrParameters: "components-button--with-ovr-parameters",
  skipped: "components-button--skipped",
  withPlay: "components-button--with-play",
  playThrows: "components-button--play-throws",
} as const;

const DOCS_ID = "components-button--docs";

const BOOT_TIMEOUT_MS = 30_000;
const RENDER_TIMEOUT_MS = 15_000;

const fixtures = availableStorybookFixtures();

const uploadFixtureArtifact = async (
  fixture: StorybookFixture,
  artifactPath: string,
): Promise<void> => {
  const workDir = await mkdtemp(path.join(tmpdir(), "ovr-storybook-fixture-"));
  const tarballPath = path.join(workDir, "artifact.tar.gz");

  try {
    await tar.create({ gzip: true, file: tarballPath, cwd: fixture.buildDir }, ["."]);
    await storage.uploadFile(artifactPath, await readFile(tarballPath), "application/gzip");
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
};

describe.skipIf(fixtures.length === 0)("Storybook version compatibility", () => {
  describe.each(fixtures)("Storybook $major", (fixture) => {
    let browser: Browser;
    let proxy: StaticProxy;

    beforeAll(async () => {
      proxy = await startStaticProxy(fixture.buildDir);
      browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
    }, 180_000);

    afterAll(async () => {
      await browser?.close();
      proxy?.close();
    });

    const test = baseTest.extend<{ page: Page }>({
      // eslint-disable-next-line no-empty-pattern
      page: async ({}, use) => {
        const page = await newPage(await browser.newContext());
        await page.goto(`${proxy.origin}/iframe.html`, { waitUntil: "load" });
        await use(page);
        await page.close();
      },
    });

    test("builds a bundle we recognise as a supported version", async () => {
      const detected = await readStorybookBuildVersion(fixture.buildDir);

      expect(detected.version).toMatch(new RegExp(`^${fixture.major}\\.`));
      await expect(assertSupportedStorybookBuild(fixture.buildDir)).resolves.toBeDefined();
      await expect(detectCaptureStrategy(fixture.buildDir)).resolves.toBeDefined();
    });

    test("writes an index.json the manifest parser still understands", async () => {
      const targets = await readStoryTargets(fixture.buildDir);

      expect(targets.map((target) => target.id).sort()).toEqual(Object.values(STORY_IDS).sort());
      expect(targets.map((target) => target.id)).not.toContain(DOCS_ID);
      expect(targets.every((target) => target.title === "Components/Button")).toBe(true);
    });

    test("boots a capture page", async ({ page }) => {
      const strategy = await detectCaptureStrategy(fixture.buildDir);

      await expect(strategy.waitForBoot(page, BOOT_TIMEOUT_MS)).resolves.toBeUndefined();
    });

    test("exposes ovr story parameters through the preview", async () => {
      const { overrides, failures } = await readStoryParameterOverrides(
        fixture.buildDir,
        Object.values(STORY_IDS),
      );

      expect(failures.size).toBe(0);
      expect(overrides.get(STORY_IDS.withOvrParameters)).toEqual({
        viewports: [{ width: 320, height: 240 }],
        diffThreshold: 0.5,
      });
      expect(overrides.get(STORY_IDS.skipped)).toEqual({ skip: true });
      expect(overrides.get(STORY_IDS.default)).toBeUndefined();
    }, 180_000);

    test("renders a story", async ({ page }) => {
      const strategy = await detectCaptureStrategy(fixture.buildDir);
      await strategy.waitForBoot(page, BOOT_TIMEOUT_MS);

      const result = await page.evaluate(strategy.waitForTargetRendered, {
        targetId: STORY_IDS.default,
        timeoutMs: RENDER_TIMEOUT_MS,
      });

      expect(result).toEqual({ ok: true });
    });

    test("waits out a play function", async ({ page }) => {
      const strategy = await detectCaptureStrategy(fixture.buildDir);
      await strategy.waitForBoot(page, BOOT_TIMEOUT_MS);

      const result = await page.evaluate(strategy.waitForTargetPlayed, {
        targetId: STORY_IDS.withPlay,
        timeoutMs: RENDER_TIMEOUT_MS,
      });

      expect(result).toEqual({ ok: true });
    });

    test("fails a story whose play function throws", async ({ page }) => {
      const strategy = await detectCaptureStrategy(fixture.buildDir);
      await strategy.waitForBoot(page, BOOT_TIMEOUT_MS);

      const result = await page.evaluate(strategy.waitForTargetPlayed, {
        targetId: STORY_IDS.playThrows,
        timeoutMs: RENDER_TIMEOUT_MS,
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain("intentional play failure");
    });

    test("extracts the build into the snapshots its story parameters ask for", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await uploadFixtureArtifact(fixture, mainBuild.artifactPath);
      const targets = await readStoryTargets(fixture.buildDir);

      await extractBuild(
        mainBuild.id,
        targets,
        [{ ...captureConfiguration, name: captureConfiguration.viewportName }],
        0.1,
      );

      const snapshots = await dbClient.snapshots.findByBuild(mainBuild.id);
      const byTarget = new Map(snapshots.map((snapshot) => [snapshot.targetId, snapshot]));

      expect(byTarget.has(STORY_IDS.skipped)).toBe(false);
      expect(byTarget.has(STORY_IDS.default)).toBe(true);

      expect(byTarget.get(STORY_IDS.withOvrParameters)).toMatchObject({
        viewportWidth: 320,
        viewportHeight: 240,
        diffThreshold: 0.5,
      });
      expect(byTarget.get(STORY_IDS.default)).toMatchObject({
        viewportWidth: captureConfiguration.viewportWidth,
        diffThreshold: 0.1,
      });
    }, 180_000);

    test("captures a screenshot of a real story", async ({ mainBuild, captureConfiguration }) => {
      await uploadFixtureArtifact(fixture, mainBuild.artifactPath);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: STORY_IDS.default,
          },
        ],
      });

      await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [snapshot!.id]);

      const captured = await dbClient.snapshots.findById(snapshot!.id);
      expect(captured).toMatchObject({ status: "success", hasRenderError: false });
      expect(captured!.imagePath).toBeTruthy();
    }, 180_000);
  });
});
