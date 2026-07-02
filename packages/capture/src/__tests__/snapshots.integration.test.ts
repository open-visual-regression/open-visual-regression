import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Worker } from "bullmq";
import type { Redis } from "ioredis";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import * as tar from "tar";
import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";
import { QueueName, type DiffJobPayload } from "@ovr/queue";
import { storage } from "@ovr/storage";

import { captureBuildGroup, diffSnapshot, enqueueSnapshotDiff } from "../snapshots";
import { describe, expect, test } from "./fixtures";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const IFRAME_HTML = await readFile(path.join(TEST_DIR, "html/iframe-static.html"), "utf-8");

const uploadArtifactWithIframe = async (
  artifactPath: string,
  iframeHtml: string,
): Promise<void> => {
  const sourceDir = await mkdtemp(path.join(tmpdir(), "ovr-snapshot-fixture-"));

  try {
    await writeFile(path.join(sourceDir, "iframe.html"), iframeHtml);
    await writeFile(path.join(sourceDir, "index.json"), JSON.stringify({ v: 3, entries: {} }));

    const tarballPath = path.join(sourceDir, "..", `${path.basename(sourceDir)}.tar.gz`);
    await tar.create({ gzip: true, file: tarballPath, cwd: sourceDir }, ["."]);
    const tarball = await readFile(tarballPath);
    await rm(tarballPath, { force: true });

    await storage.uploadFile(artifactPath, tarball, "application/gzip");
  } finally {
    await rm(sourceDir, { recursive: true, force: true });
  }
};

const uploadPng = async (path: string, fill: number, width = 2, height = 2): Promise<void> => {
  const png = new PNG({ width, height });
  png.data.fill(fill);
  await storage.uploadFile(path, PNG.sync.write(png), "image/png");
};

const collectDiffJob = async (connection: Redis): Promise<DiffJobPayload> => {
  const worker = new Worker<DiffJobPayload>(QueueName.SNAPSHOT_DIFF, async (job) => job.data, {
    connection,
  });

  try {
    return await new Promise<DiffJobPayload>((resolve, reject) => {
      worker.on("completed", (job) => resolve(job.data));
      worker.on("failed", (_job, error) => reject(error));
    });
  } finally {
    await worker.close();
  }
};

describe("snapshots", () => {
  describe("captureBuildGroup", () => {
    test("should let a reviewer see a screenshot of the story, and move the build toward a diff once every story in the build has been captured", async ({
      mainBuild,
      captureConfiguration,
      connection,
    }) => {
      await uploadArtifactWithIframe(mainBuild.artifactPath, IFRAME_HTML);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
          },
        ],
      });

      await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [snapshot!.id]);

      const captured = await dbClient.snapshots.findById(snapshot!.id);
      expect(captured).toMatchObject({ status: "success", hasRenderError: false });
      expect(captured!.imagePath).toBe(
        `${mainBuild.projectId}/builds/${mainBuild.id}/snapshots/${snapshot!.id}.png`,
      );

      const imageStream = await storage.getFileStream(captured!.imagePath!);
      expect(imageStream).toBeDefined();

      const job = await collectDiffJob(connection);
      expect(job.snapshotId).toBe(snapshot!.id);
    });

    test("should re-enqueue a pending diff that was never dispatched", async ({
      mainBuild,
      captureConfiguration,
      connection,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-recovery",
          },
        ],
      });
      const existingDiff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await enqueueSnapshotDiff(snapshot!.id);

      const job = await collectDiffJob(connection);
      expect(job).toEqual({ snapshotId: snapshot!.id, diffId: existingDiff!.id });
    });

    test("should still let a reviewer see the story, flagged as a render error, when the story fails to render", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await uploadArtifactWithIframe(
        mainBuild.artifactPath,
        IFRAME_HTML.replace(
          'listener({ storyId: payload.storyId, status: "success" });',
          'listener({ storyId: payload.storyId, status: "error" });',
        ),
      );
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
          },
        ],
      });

      await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [snapshot!.id]);

      const captured = await dbClient.snapshots.findById(snapshot!.id);
      expect(captured).toMatchObject({ status: "success", hasRenderError: true });

      const logs = await dbClient.snapshotLogs.findBySnapshot(snapshot!.id);
      expect(logs.length).toBeGreaterThan(0);
    });

    test("should let a reviewer see the story as captured when the app logs a console error without an uncaught exception", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await uploadArtifactWithIframe(
        mainBuild.artifactPath,
        IFRAME_HTML.replace("</body>", '<script>console.error("logged error");</script></body>'),
      );
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
          },
        ],
      });

      await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [snapshot!.id]);

      const captured = await dbClient.snapshots.findById(snapshot!.id);
      expect(captured).toMatchObject({ status: "success", hasRenderError: false });

      const logs = await dbClient.snapshotLogs.findBySnapshot(snapshot!.id);
      expect(logs.some((log) => log.level === "error")).toBe(true);
    });

    test("captures every snapshot in a group using a single browser launch", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await uploadArtifactWithIframe(mainBuild.artifactPath, IFRAME_HTML);
      const snapshots = await dbClient.snapshots.createMany({
        values: [
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" },
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-b" },
        ],
      });

      const launchSpy = vi.spyOn(chromium, "launch");

      await captureBuildGroup(
        mainBuild.id,
        captureConfiguration.browser,
        snapshots.map((snapshot) => snapshot!.id),
      );

      expect(launchSpy).toHaveBeenCalledTimes(1);

      for (const snapshot of snapshots) {
        expect(await dbClient.snapshots.findById(snapshot!.id)).toMatchObject({
          status: "success",
          hasRenderError: false,
        });
      }
    });

    test("captures the same story at multiple viewports in one group without a render error", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await uploadArtifactWithIframe(mainBuild.artifactPath, IFRAME_HTML);
      const snapshots = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
            viewportWidth: 1280,
          },
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
            viewportWidth: 768,
          },
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
            viewportWidth: 375,
          },
        ],
      });

      await captureBuildGroup(
        mainBuild.id,
        captureConfiguration.browser,
        snapshots.map((snapshot) => snapshot!.id),
      );

      for (const snapshot of snapshots) {
        expect(await dbClient.snapshots.findById(snapshot!.id)).toMatchObject({
          status: "success",
          hasRenderError: false,
        });
      }
    });

    test("marks only the failing snapshot as errored while the rest of the group still succeeds", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await uploadArtifactWithIframe(mainBuild.artifactPath, IFRAME_HTML);
      const [badSnapshot, goodSnapshot] = await dbClient.snapshots.createMany({
        values: [
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-bad" },
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-good" },
        ],
      });

      vi.spyOn(storage, "uploadFile").mockRejectedValueOnce(new Error("simulated upload failure"));

      await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [
        badSnapshot!.id,
        goodSnapshot!.id,
      ]);

      expect(await dbClient.snapshots.findById(badSnapshot!.id)).toMatchObject({
        status: "error",
      });
      expect(await dbClient.snapshots.findById(goodSnapshot!.id)).toMatchObject({
        status: "success",
      });
    });

    test("skips a snapshot in the group that a previous attempt already captured successfully", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await uploadArtifactWithIframe(mainBuild.artifactPath, IFRAME_HTML);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" }],
      });

      await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [snapshot!.id]);
      expect(await dbClient.snapshots.findById(snapshot!.id)).toMatchObject({
        status: "success",
      });

      const uploadSpy = vi.spyOn(storage, "uploadFile");

      await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [snapshot!.id]);

      expect(uploadSpy).not.toHaveBeenCalled();
    });
  });

  describe("diffSnapshot", () => {
    test("should ask a reviewer to approve the story when it has never been approved before, and move the build toward done once every story has a verdict", async ({
      featureBuild,
      captureConfiguration,
      connection,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
            status: "success",
            imagePath: `builds/${featureBuild.id}/snapshots/no-baseline.png`,
          },
        ],
      });
      await uploadPng(snapshot!.imagePath!, 255);
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await diffSnapshot(snapshot!.id, diff!.id);

      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        processingStatus: "success",
        reviewStatus: "needs_review",
      });

      const worker = new Worker(QueueName.BUILD_FINALIZE, async (job) => job.data, { connection });
      try {
        await new Promise((resolve, reject) => {
          worker.on("completed", resolve);
          worker.on("failed", (_job, error) => reject(error));
        });
      } finally {
        await worker.close();
      }
    });

    test("should approve a story automatically, with nothing for a reviewer to do, when it renders the same as the approved baseline", async ({
      featureBuild,
      project,
      captureConfiguration,
    }) => {
      const baselinePath = `builds/${featureBuild.id}/snapshots/baseline.png`;
      const capturePath = `builds/${featureBuild.id}/snapshots/capture.png`;
      await uploadPng(baselinePath, 255);
      await uploadPng(capturePath, 255);

      const [baselineSnapshot, captureSnapshotRow] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
            status: "success",
            imagePath: baselinePath,
          },
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
            status: "success",
            imagePath: capturePath,
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-a",
        snapshotId: baselineSnapshot!.id,
        approvedBy: featureBuild.createdBy,
      });
      const diff = await dbClient.diffs.create({ snapshotId: captureSnapshotRow!.id });

      await diffSnapshot(captureSnapshotRow!.id, diff!.id);

      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        processingStatus: "success",
        reviewStatus: "not_required",
        pixelDiffCount: 0,
        diffPercent: 0,
      });
    });

    test("should ask a reviewer to approve a story and show them what changed when it renders differently from the approved baseline", async ({
      featureBuild,
      project,
      captureConfiguration,
    }) => {
      const baselinePath = `builds/${featureBuild.id}/snapshots/baseline-2.png`;
      const capturePath = `builds/${featureBuild.id}/snapshots/capture-2.png`;
      await uploadPng(baselinePath, 0);
      await uploadPng(capturePath, 255);

      const [baselineSnapshot, captureSnapshotRow] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-b",
            status: "success",
            imagePath: baselinePath,
          },
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-b",
            status: "success",
            imagePath: capturePath,
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-b",
        snapshotId: baselineSnapshot!.id,
        approvedBy: featureBuild.createdBy,
      });
      const diff = await dbClient.diffs.create({ snapshotId: captureSnapshotRow!.id });

      await diffSnapshot(captureSnapshotRow!.id, diff!.id);

      const result = await dbClient.diffs.findById(diff!.id);
      expect(result).toMatchObject({ processingStatus: "success", reviewStatus: "needs_review" });
      expect(result!.diffImagePath).toBe(
        `${featureBuild.projectId}/builds/${featureBuild.id}/diffs/${diff!.id}.png`,
      );
      expect(result!.pixelDiffCount).toBeGreaterThan(0);

      const diffImage = await storage.getFileStream(result!.diffImagePath!);
      expect(diffImage).toBeDefined();
    });

    test("diffs against a differently-sized baseline instead of skipping the comparison", async ({
      featureBuild,
      project,
      captureConfiguration,
    }) => {
      const baselinePath = `builds/${featureBuild.id}/snapshots/baseline-3.png`;
      const capturePath = `builds/${featureBuild.id}/snapshots/capture-3.png`;
      await uploadPng(baselinePath, 255, 2, 4);
      await uploadPng(capturePath, 255, 2, 2);

      const [baselineSnapshot, captureSnapshotRow] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-sized",
            status: "success",
            imagePath: baselinePath,
          },
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-sized",
            status: "success",
            imagePath: capturePath,
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-sized",
        snapshotId: baselineSnapshot!.id,
        approvedBy: featureBuild.createdBy,
      });
      const diff = await dbClient.diffs.create({ snapshotId: captureSnapshotRow!.id });

      await diffSnapshot(captureSnapshotRow!.id, diff!.id);

      const result = await dbClient.diffs.findById(diff!.id);
      expect(result).toMatchObject({ processingStatus: "success", reviewStatus: "needs_review" });
      expect(result!.baselineSnapshotId).toBe(baselineSnapshot!.id);
      expect(result!.pixelDiffCount).toBeGreaterThan(0);
      expect(result!.diffImagePath).toBe(
        `${featureBuild.projectId}/builds/${featureBuild.id}/diffs/${diff!.id}.png`,
      );
    });

    test("promotes the baseline and skips review entirely for a main-branch build with no prior baseline", async ({
      mainBuild,
      project,
      captureConfiguration,
    }) => {
      const capturePath = `builds/${mainBuild.id}/snapshots/main-no-baseline.png`;
      await uploadPng(capturePath, 255);

      const [captureSnapshotRow] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-c",
            status: "success",
            imagePath: capturePath,
          },
        ],
      });
      const diff = await dbClient.diffs.create({ snapshotId: captureSnapshotRow!.id });

      await diffSnapshot(captureSnapshotRow!.id, diff!.id);

      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        processingStatus: "success",
        reviewStatus: "not_required",
      });

      const baseline = await dbClient.baselines.find({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-c",
      });
      expect(baseline?.snapshotId).toBe(captureSnapshotRow!.id);
    });

    test("promotes the baseline and skips review for a main-branch build even when the diff is large", async ({
      mainBuild,
      project,
      captureConfiguration,
    }) => {
      const baselinePath = `builds/${mainBuild.id}/snapshots/main-baseline.png`;
      const capturePath = `builds/${mainBuild.id}/snapshots/main-capture.png`;
      await uploadPng(baselinePath, 0);
      await uploadPng(capturePath, 255);

      const [baselineSnapshot, captureSnapshotRow] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-d",
            status: "success",
            imagePath: baselinePath,
          },
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-d",
            status: "success",
            imagePath: capturePath,
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-d",
        snapshotId: baselineSnapshot!.id,
        approvedBy: mainBuild.createdBy,
      });
      const diff = await dbClient.diffs.create({ snapshotId: captureSnapshotRow!.id });

      await diffSnapshot(captureSnapshotRow!.id, diff!.id);

      const result = await dbClient.diffs.findById(diff!.id);
      expect(result).toMatchObject({
        processingStatus: "success",
        reviewStatus: "not_required",
      });
      expect(result!.pixelDiffCount).toBeGreaterThan(0);

      const baseline = await dbClient.baselines.find({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-d",
      });
      expect(baseline?.snapshotId).toBe(captureSnapshotRow!.id);
    });

    test("marks the diff as errored without comparing pixels when the snapshot failed to render", async ({
      featureBuild,
      captureConfiguration,
    }) => {
      const capturePath = `builds/${featureBuild.id}/snapshots/render-error.png`;
      await uploadPng(capturePath, 255);

      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-render-error",
            status: "success",
            imagePath: capturePath,
            hasRenderError: true,
          },
        ],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await diffSnapshot(snapshot!.id, diff!.id);

      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        processingStatus: "error",
        reviewStatus: "not_required",
        pixelDiffCount: null,
      });
    });
  });
});
