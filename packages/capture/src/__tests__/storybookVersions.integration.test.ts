import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import * as tar from "tar";

import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";
import { availableStorybookFixtures, type StorybookFixture } from "@ovr/storybook-compat/fixtures";
import { readStoryTargets } from "@ovr/storybook-compat/manifest";

import { detectCaptureStrategy } from "../captureStrategies";
import { extractBuild } from "../extract";
import { captureBuildGroup } from "../snapshots";
import { describe, expect, test, withCapturePage } from "./fixtures";

const STORY_IDS = {
  default: "components-button--default",
  withOvrParameters: "components-button--with-ovr-parameters",
  skipped: "components-button--skipped",
  withPlay: "components-button--with-play",
  playThrows: "components-button--play-throws",
} as const;

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
    test("boots a capture page", async () => {
      const strategy = await detectCaptureStrategy(fixture.buildDir);

      await withCapturePage(fixture.buildDir, async (page) => {
        await expect(strategy.waitForBoot(page, BOOT_TIMEOUT_MS)).resolves.toBeUndefined();
      });
    });

    test("waits out a play function", async () => {
      const strategy = await detectCaptureStrategy(fixture.buildDir);

      await withCapturePage(fixture.buildDir, async (page) => {
        await strategy.waitForBoot(page, BOOT_TIMEOUT_MS);

        const result = await page.evaluate(strategy.waitForTargetPlayed, {
          targetId: STORY_IDS.withPlay,
          timeoutMs: RENDER_TIMEOUT_MS,
        });

        expect(result).toEqual({ ok: true });
      });
    });

    test("fails a story whose play function throws", async () => {
      const strategy = await detectCaptureStrategy(fixture.buildDir);

      await withCapturePage(fixture.buildDir, async (page) => {
        await strategy.waitForBoot(page, BOOT_TIMEOUT_MS);

        const result = await page.evaluate(strategy.waitForTargetPlayed, {
          targetId: STORY_IDS.playThrows,
          timeoutMs: RENDER_TIMEOUT_MS,
        });

        expect(result.ok).toBe(false);
        expect(result.error).toContain("intentional play failure");
      });
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
