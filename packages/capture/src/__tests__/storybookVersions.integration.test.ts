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
import { describe, expect, test } from "./fixtures";

// Every story the fixtures define, at every supported Storybook major.
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

// These specs are the support matrix for the Storybook versions we advertise:
// each one runs the real capture code against a real `storybook build` output
// of that major, so an upstream change to the manifest, the preview globals or
// the channel events fails here rather than in a user's build.
describe.skipIf(fixtures.length === 0)("Storybook version compatibility", () => {
  describe.each(fixtures)("Storybook $major", (fixture) => {
    let browser: Browser;
    let proxy: StaticProxy;
    let page: Page;

    beforeAll(async () => {
      proxy = await startStaticProxy(fixture.buildDir);
      browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
      page = await newPage(await browser.newContext());
      await page.goto(`${proxy.origin}/iframe.html`, { waitUntil: "load" });
    }, 180_000);

    afterAll(async () => {
      await browser?.close();
      proxy?.close();
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

    // Covers the two globals the capture page waits on before it will screenshot
    // anything: the #storybook-root element and __STORYBOOK_ADDONS_CHANNEL__.
    test("boots a capture page", async () => {
      const strategy = await detectCaptureStrategy(fixture.buildDir);

      await expect(strategy.waitForBoot(page, BOOT_TIMEOUT_MS)).resolves.toBeUndefined();
    });

    // Covers __STORYBOOK_PREVIEW__.storeInitializationPromise and loadStory,
    // which is the only route `ovr` story parameters have into the extract step.
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

    test("renders a story", async () => {
      const strategy = await detectCaptureStrategy(fixture.buildDir);

      const result = await page.evaluate(strategy.waitForTargetRendered, {
        targetId: STORY_IDS.default,
        timeoutMs: RENDER_TIMEOUT_MS,
      });

      expect(result).toEqual({ ok: true });
    });

    // `storyFinished` is why the supported floor is 8.5: without it this wait
    // never resolves and every story burns the render timeout.
    test("waits out a play function", async () => {
      const strategy = await detectCaptureStrategy(fixture.buildDir);

      const result = await page.evaluate(strategy.waitForTargetPlayed, {
        targetId: STORY_IDS.withPlay,
        timeoutMs: RENDER_TIMEOUT_MS,
      });

      expect(result).toEqual({ ok: true });
    });

    // Storybook 9 and 10 report storyFinished with status "success" even when
    // the play function threw, so the strategy has to decide from the error
    // events that precede it. This catches a regression to trusting `status`.
    test("fails a story whose play function throws", async () => {
      const strategy = await detectCaptureStrategy(fixture.buildDir);

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

      // `skip: true` keeps the story out of the build entirely.
      expect(byTarget.has(STORY_IDS.skipped)).toBe(false);
      expect(byTarget.has(STORY_IDS.default)).toBe(true);

      // The viewport and threshold overrides come from the story's parameters.
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
