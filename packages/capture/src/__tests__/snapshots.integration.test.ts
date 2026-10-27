import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Worker } from "bullmq";
import { PNG } from "pngjs";
import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";
import type { BuildDbSchema } from "@ovr/db/repository/builds";
import { QueueName, type RedisConnection, type DiffJobPayload } from "@ovr/queue";
import { storage } from "@ovr/storage";

import { captureBuildGroup, diffSnapshot, enqueueSnapshotDiff } from "../snapshots";
import {
  describe,
  enableFlakyDetection,
  expect,
  spyOnBrowserServers,
  test,
  uploadArtifactWithIframe,
  type Viewport,
} from "./fixtures";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const IFRAME_HTML = await readFile(path.join(TEST_DIR, "html/iframe-static.html"), "utf-8");

const uploadPng = async (path: string, fill: number, width = 2, height = 2): Promise<void> => {
  const png = new PNG({ width, height });
  png.data.fill(fill);
  await storage.uploadFile(path, PNG.sync.write(png), "image/png");
};

const uploadSpeckledPng = async (
  path: string,
  fill: number,
  speckleFill: number,
  width = 100,
  height = 100,
): Promise<void> => {
  const png = new PNG({ width, height });
  png.data.fill(fill);
  const speckleStart = 0;
  png.data.fill(speckleFill, speckleStart, speckleStart + 4);
  await storage.uploadFile(path, PNG.sync.write(png), "image/png");
};

const diffCapture = async (
  build: NonNullable<BuildDbSchema>,
  captureConfiguration: Viewport,
  targetId: string,
  upload: (path: string) => Promise<void>,
) => {
  const imagePath = `builds/${build.id}/snapshots/${randomUUID()}.png`;
  await upload(imagePath);
  const image = Buffer.concat(await (await storage.getFileStream(imagePath)).toArray());

  const [snapshot] = await dbClient.snapshots.createMany({
    values: [
      {
        buildId: build.id,
        ...captureConfiguration,
        targetId,
        status: "success",
        imagePath,
        imageHash: createHash("sha256").update(image).digest("hex"),
      },
    ],
  });
  const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

  await diffSnapshot(snapshot!.id, diff!.id);

  return (await dbClient.snapshots.findById(snapshot!.id))!;
};

const collectDiffJob = async (connection: RedisConnection): Promise<DiffJobPayload> => {
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
        `${mainBuild.projectId}/builds/${mainBuild.id}/snapshots/${snapshot!.id}-1.png`,
      );

      const imageStream = await storage.getFileStream(captured!.imagePath!);
      const image = Buffer.concat(await imageStream.toArray());
      expect(captured!.imageHash).toBe(createHash("sha256").update(image).digest("hex"));

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

    test("should still flag a render error when the story throws but Storybook reports it finished successfully", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await uploadArtifactWithIframe(
        mainBuild.artifactPath,
        IFRAME_HTML.replace(
          'for (const listener of this._l["storyFinished"] || []) {',
          `for (const listener of this._l["storyThrewException"] || []) {
            listener({ message: "No QueryClient set, use QueryClientProvider to set one" });
          }
          for (const listener of this._l["storyFinished"] || []) {`,
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
      expect(logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: "error",
            message: expect.stringContaining("No QueryClient set"),
          }),
        ]),
      );
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

    describe("external requests", () => {
      const iframeWithRemoteImages = IFRAME_HTML.replace(
        "</body>",
        `<img src="http://images.invalid/a.png" />
        <img src="http://images.invalid/b.png" />
        <img src="http://fonts.invalid:8080/c.png" />
        </body>`,
      );

      const captureBlockedHostLogs = async (
        build: { id: string; artifactPath: string },
        captureConfiguration: Viewport,
        externalRequestAllowlist: string[] | null,
      ) => {
        await uploadArtifactWithIframe(build.artifactPath, iframeWithRemoteImages);
        const [snapshot] = await dbClient.snapshots.createMany({
          values: [
            {
              buildId: build.id,
              ...captureConfiguration,
              targetId: "story-a",
              externalRequestAllowlist,
            },
          ],
        });

        await captureBuildGroup(build.id, captureConfiguration.browser, [snapshot!.id], {
          externalRequestAllowlist,
        });

        const captured = await dbClient.snapshots.findById(snapshot!.id);
        expect(captured).toMatchObject({ status: "success" });

        const logs = await dbClient.snapshotLogs.findBySnapshot(snapshot!.id);
        return logs.filter((log) => log.message.startsWith("Blocked requests"));
      };

      test("should not report blocked hosts when the snapshot doesn't block external requests", async ({
        mainBuild,
        captureConfiguration,
      }) => {
        expect(await captureBlockedHostLogs(mainBuild, captureConfiguration, null)).toEqual([]);
      });

      test("should log one warning naming each blocked host", async ({
        mainBuild,
        captureConfiguration,
      }) => {
        const logs = await captureBlockedHostLogs(mainBuild, captureConfiguration, []);

        expect(logs).toEqual([
          expect.objectContaining({
            level: "warning",
            message: expect.stringContaining("fonts.invalid:8080, images.invalid."),
          }),
        ]);
      });

      test("should leave allowed hosts out of the warning", async ({
        mainBuild,
        captureConfiguration,
      }) => {
        const logs = await captureBlockedHostLogs(mainBuild, captureConfiguration, [
          "images.invalid",
        ]);

        expect(logs).toEqual([
          expect.objectContaining({
            message: expect.stringContaining("Blocked requests to fonts.invalid:8080."),
          }),
        ]);
      });
    });

    describe("waitForTimeout", () => {
      const LATE_LOG = "late data loaded";
      const iframeWithLateLog = IFRAME_HTML.replace(
        "</body>",
        `<script>
          window.__STORYBOOK_ADDONS_CHANNEL__.on("storyFinished", () => {
            setTimeout(() => console.log(${JSON.stringify(LATE_LOG)}), 2000);
          });
        </script></body>`,
      );

      const captureLogs = async (
        mainBuild: { id: string; artifactPath: string },
        captureConfiguration: {
          browser: string;
          viewportWidth: number;
          viewportHeight?: number;
          viewportName: string;
        },
        waitForTimeout: number,
      ) => {
        await uploadArtifactWithIframe(mainBuild.artifactPath, iframeWithLateLog);
        const [snapshot] = await dbClient.snapshots.createMany({
          values: [
            {
              buildId: mainBuild.id,
              ...captureConfiguration,
              targetId: "story-a",
              waitForTimeout,
            },
          ],
        });

        await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [snapshot!.id]);

        const captured = await dbClient.snapshots.findById(snapshot!.id);
        expect(captured).toMatchObject({ status: "success", hasRenderError: false });
        return dbClient.snapshotLogs.findBySnapshot(snapshot!.id);
      };

      test("should take the screenshot before late-loading work finishes when no wait is set", async ({
        mainBuild,
        captureConfiguration,
      }) => {
        const logs = await captureLogs(mainBuild, captureConfiguration, 0);
        expect(logs.map((log) => log.message)).not.toContain(LATE_LOG);
      });

      test("should wait for the snapshot's waitForTimeout before taking the screenshot", async ({
        mainBuild,
        captureConfiguration,
      }) => {
        const logs = await captureLogs(mainBuild, captureConfiguration, 2500);
        expect(logs.map((log) => log.message)).toContain(LATE_LOG);
      });
    });

    test("should flag an uncaught page error separately from a render error when Storybook still reports success", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await uploadArtifactWithIframe(
        mainBuild.artifactPath,
        IFRAME_HTML.replace(
          "</body>",
          '<script>throw new Error("uncaught but recovered");</script></body>',
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
      expect(captured).toMatchObject({
        status: "success",
        hasRenderError: false,
        hasUncaughtPageError: true,
      });

      const logs = await dbClient.snapshotLogs.findBySnapshot(snapshot!.id);
      expect(logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: "error",
            message: expect.stringContaining("uncaught but recovered"),
          }),
        ]),
      );
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

      const { spy: launchSpy } = spyOnBrowserServers();

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

    test("downloads the storybook bundle once for a build split across capture groups", async ({
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

      const downloadSpy = vi.spyOn(storage, "getFileStream");

      for (const snapshot of snapshots) {
        await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [snapshot!.id]);
      }

      expect(downloadSpy).toHaveBeenCalledTimes(1);

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
      metrics,
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

      const body = await metrics.scrape();
      expect(body).toContain(
        'ovr_snapshots_captured_total{browser="chromium",outcome="success"} 1',
      );
      expect(body).toContain('ovr_snapshots_captured_total{browser="chromium",outcome="error"} 1');
      expect(body).toContain('ovr_snapshot_capture_duration_seconds_count{browser="chromium"} 1');
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

    test("keeps the build queued until its first snapshot starts capturing", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await uploadArtifactWithIframe(mainBuild.artifactPath, IFRAME_HTML);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" }],
      });
      expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
        processingStatus: "queued",
        startedAt: null,
      });

      await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [snapshot!.id]);

      expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
        processingStatus: "processing",
        startedAt: expect.any(String),
      });
    });

    test("does no capture work for a queued group whose build has already errored", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await uploadArtifactWithIframe(mainBuild.artifactPath, IFRAME_HTML);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" }],
      });
      await dbClient.builds.updateProcessingStatus(mainBuild.id, "error", "Build timed out");

      const downloadSpy = vi.spyOn(storage, "getFileStream");
      const { spy: launchSpy } = spyOnBrowserServers();
      const uploadSpy = vi.spyOn(storage, "uploadFile");

      await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [snapshot!.id]);

      expect(downloadSpy).not.toHaveBeenCalled();
      expect(launchSpy).not.toHaveBeenCalled();
      expect(uploadSpy).not.toHaveBeenCalled();
      expect(await dbClient.snapshots.findById(snapshot!.id)).toMatchObject({ status: "queued" });
      expect(await dbClient.diffs.findBySnapshot(snapshot!.id)).toBeUndefined();
    });

    test("skips snapshots the reaper errored once the build fails mid-group", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await uploadArtifactWithIframe(mainBuild.artifactPath, IFRAME_HTML);
      const [first, second] = await dbClient.snapshots.createMany({
        values: [
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" },
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-b" },
        ],
      });

      const updateStatus = dbClient.snapshots.updateStatus;
      const updateStatusSpy = vi
        .spyOn(dbClient.snapshots, "updateStatus")
        .mockImplementationOnce(async (id, status) => {
          const updated = await updateStatus(id, status);
          await dbClient.transaction(async (tx) => {
            await dbClient.snapshots.markUnfinishedAs(mainBuild.id, "error", tx);
            await dbClient.builds.updateProcessingStatus(mainBuild.id, "error", "timed out", tx);
          });
          return updated;
        });

      await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [first!.id, second!.id]);

      expect(updateStatusSpy).toHaveBeenCalledTimes(1);
      expect(await dbClient.snapshots.findById(second!.id)).toMatchObject({ status: "error" });
      expect(await dbClient.diffs.findBySnapshot(second!.id)).toBeUndefined();
    });

    test("captures a snapshot requeued for a retry after the reaper errored it", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await uploadArtifactWithIframe(mainBuild.artifactPath, IFRAME_HTML);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" }],
      });
      await dbClient.transaction(async (tx) => {
        await dbClient.snapshots.markUnfinishedAs(mainBuild.id, "error", tx);
        await dbClient.builds.updateProcessingStatus(mainBuild.id, "error", "timed out", tx);
      });

      await dbClient.transaction(async (tx) => {
        await dbClient.snapshots.requeue(snapshot!.id, tx);
        await dbClient.builds.updateProcessingStatus(mainBuild.id, "processing", null, tx);
      });

      await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [snapshot!.id]);

      expect(await dbClient.snapshots.findById(snapshot!.id)).toMatchObject({
        status: "success",
        captureAttempt: snapshot!.captureAttempt + 1,
      });
    });
  });

  describe("diffSnapshot", () => {
    test("errors a pending diff without comparing pixels when its build has already errored", async ({
      featureBuild,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
            status: "success",
            imagePath: `builds/${featureBuild.id}/snapshots/never-uploaded.png`,
          },
        ],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });
      await dbClient.builds.updateProcessingStatus(featureBuild.id, "error", "Build timed out");

      const downloadSpy = vi.spyOn(storage, "getFileStream");

      await diffSnapshot(snapshot!.id, diff!.id);

      expect(downloadSpy).not.toHaveBeenCalled();
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ processingStatus: "error" });
      expect(await dbClient.builds.findById(featureBuild.id)).toMatchObject({
        processingStatus: "error",
      });
    });

    test("should ask a reviewer to approve the story when it has never been approved before, and move the build toward done once every story has a verdict", async ({
      featureBuild,
      captureConfiguration,
      connection,
      metrics,
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

      expect(await metrics.scrape()).toContain('ovr_diffs_compared_total{result="new"} 1');
    });

    test("should approve a story automatically, with nothing for a reviewer to do, when it renders the same as the approved baseline", async ({
      featureBuild,
      project,
      captureConfiguration,
      metrics,
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
        reviewStatus: "unchanged",
        pixelDiffCount: 0,
        diffPercent: 0,
      });

      expect(await metrics.scrape()).toContain('ovr_diffs_compared_total{result="unchanged"} 1');
    });

    test("should approve a story without reading either screenshot when its image hash matches the approved baseline", async ({
      featureBuild,
      project,
      captureConfiguration,
    }) => {
      const imageHash = createHash("sha256").update("identical screenshot").digest("hex");

      const [baselineSnapshot, captureSnapshotRow] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-hash",
            status: "success",
            imagePath: `builds/${featureBuild.id}/snapshots/missing-baseline.png`,
            imageHash,
          },
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-hash",
            status: "success",
            imagePath: `builds/${featureBuild.id}/snapshots/missing-capture.png`,
            imageHash,
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-hash",
        snapshotId: baselineSnapshot!.id,
        approvedBy: featureBuild.createdBy,
      });
      const diff = await dbClient.diffs.create({ snapshotId: captureSnapshotRow!.id });

      await diffSnapshot(captureSnapshotRow!.id, diff!.id);

      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        processingStatus: "success",
        reviewStatus: "unchanged",
        baselineSnapshotId: baselineSnapshot!.id,
        pixelDiffCount: 0,
        diffPercent: 0,
        diffImagePath: null,
      });
    });

    test("saves a diff image for a story that renders within the diff threshold of the approved baseline", async ({
      featureBuild,
      project,
      captureConfiguration,
    }) => {
      const baselinePath = `builds/${featureBuild.id}/snapshots/baseline-speckle.png`;
      const capturePath = `builds/${featureBuild.id}/snapshots/capture-speckle.png`;
      await uploadSpeckledPng(baselinePath, 0, 0);
      await uploadSpeckledPng(capturePath, 0, 255);

      const [baselineSnapshot, captureSnapshotRow] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-speckle",
            status: "success",
            imagePath: baselinePath,
          },
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-speckle",
            status: "success",
            imagePath: capturePath,
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-speckle",
        snapshotId: baselineSnapshot!.id,
        approvedBy: featureBuild.createdBy,
      });
      const diff = await dbClient.diffs.create({ snapshotId: captureSnapshotRow!.id });

      await diffSnapshot(captureSnapshotRow!.id, diff!.id);

      const result = await dbClient.diffs.findById(diff!.id);
      expect(result).toMatchObject({ processingStatus: "success", reviewStatus: "unchanged" });
      expect(result!.pixelDiffCount).toBeGreaterThan(0);
      expect(result!.diffImagePath).toBe(
        `${featureBuild.projectId}/builds/${featureBuild.id}/diffs/${diff!.id}.png`,
      );

      const diffImage = await storage.getFileStream(result!.diffImagePath!);
      expect(diffImage).toBeDefined();
    });

    test("should ask a reviewer to approve a story and show them what changed when it renders differently from the approved baseline", async ({
      featureBuild,
      project,
      captureConfiguration,
      metrics,
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

      expect(await metrics.scrape()).toContain('ovr_diffs_compared_total{result="changed"} 1');
    });

    test("compares later captures against an approved baseline without downloading it again", async ({
      featureBuild,
      captureConfiguration,
      approveBaseline,
    }) => {
      const baselinePath = `builds/${featureBuild.id}/snapshots/baseline-cached.png`;
      await uploadPng(baselinePath, 0);
      await approveBaseline({
        build: featureBuild,
        targetId: "story-cached",
        imagePath: baselinePath,
      });

      const download = vi.spyOn(storage, "getFileStream");

      for (const fill of [128, 255]) {
        const capturePath = `builds/${featureBuild.id}/snapshots/capture-${fill}.png`;
        await uploadPng(capturePath, fill);
        const [snapshot] = await dbClient.snapshots.createMany({
          values: [
            {
              buildId: featureBuild.id,
              ...captureConfiguration,
              targetId: "story-cached",
              status: "success",
              imagePath: capturePath,
            },
          ],
        });
        const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

        await diffSnapshot(snapshot!.id, diff!.id);

        expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
          processingStatus: "success",
          reviewStatus: "needs_review",
        });
      }

      expect(download.mock.calls.filter(([path]) => path === baselinePath)).toHaveLength(1);
    });

    test("should not hold on to memory as stories that changed keep getting diffed", async ({
      featureBuild,
      captureConfiguration,
      approveBaseline,
    }) => {
      const baselinePath = `builds/${featureBuild.id}/snapshots/baseline-large.png`;
      const capturePath = `builds/${featureBuild.id}/snapshots/capture-large.png`;
      await uploadPng(baselinePath, 0, 1280, 1600);
      await uploadPng(capturePath, 255, 1280, 1600);
      await approveBaseline({
        build: featureBuild,
        targetId: "story-large",
        imagePath: baselinePath,
      });
      const snapshots = await dbClient.snapshots.createMany({
        values: Array.from({ length: 100 }, () => ({
          buildId: featureBuild.id,
          ...captureConfiguration,
          targetId: "story-large",
          status: "success" as const,
          imagePath: capturePath,
        })),
      });
      const diffs = await Promise.all(
        snapshots.map((snapshot) => dbClient.diffs.create({ snapshotId: snapshot!.id })),
      );
      const rssBefore = process.memoryUsage().rss;

      await Promise.all(diffs.map((diff) => diffSnapshot(diff!.snapshotId, diff!.id)));

      expect(process.memoryUsage().rss - rssBefore).toBeLessThan(200 * 1024 ** 2);
    }, 120_000);

    test("diffs a story this worker just captured without downloading its screenshot", async ({
      featureBuild,
      captureConfiguration,
      approveBaseline,
    }) => {
      await uploadArtifactWithIframe(featureBuild.artifactPath, IFRAME_HTML);
      const baselinePath = `builds/${featureBuild.id}/snapshots/baseline-fresh.png`;
      await uploadPng(baselinePath, 0);
      await approveBaseline({ build: featureBuild, targetId: "story-a", imagePath: baselinePath });
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: featureBuild.id, ...captureConfiguration, targetId: "story-a" }],
      });

      await captureBuildGroup(featureBuild.id, captureConfiguration.browser, [snapshot!.id]);

      const captured = await dbClient.snapshots.findById(snapshot!.id);
      const diff = await dbClient.diffs.findBySnapshot(snapshot!.id);
      const download = vi.spyOn(storage, "getFileStream");

      await diffSnapshot(snapshot!.id, diff!.id);

      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        processingStatus: "success",
        reviewStatus: "needs_review",
      });
      expect(download).not.toHaveBeenCalledWith(captured!.imagePath);
    });

    test("fails the diff when a screenshot cannot be decoded, so the job is retried", async ({
      featureBuild,
      captureConfiguration,
      approveBaseline,
    }) => {
      const baselinePath = `builds/${featureBuild.id}/snapshots/baseline-corrupt.png`;
      const capturePath = `builds/${featureBuild.id}/snapshots/capture-corrupt.png`;
      await uploadPng(baselinePath, 0);
      await storage.uploadFile(capturePath, Buffer.from("not a png"), "image/png");
      await approveBaseline({
        build: featureBuild,
        targetId: "story-corrupt",
        imagePath: baselinePath,
      });
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-corrupt",
            status: "success",
            imagePath: capturePath,
          },
        ],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await expect(diffSnapshot(snapshot!.id, diff!.id)).rejects.toThrow();

      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        processingStatus: "pending",
      });
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
      metrics,
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
        reviewStatus: "auto_approved",
      });

      const baseline = await dbClient.baselines.find({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-c",
      });
      expect(baseline?.snapshotId).toBe(captureSnapshotRow!.id);

      expect(await metrics.scrape()).toContain('ovr_diffs_compared_total{result="new"} 1');
    });

    test("promotes the baseline and skips review for a main-branch build even when the diff is large", async ({
      mainBuild,
      project,
      captureConfiguration,
      metrics,
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
        reviewStatus: "auto_approved",
      });
      expect(result!.pixelDiffCount).toBeGreaterThan(0);
      expect(result!.diffImagePath).toBe(
        `${mainBuild.projectId}/builds/${mainBuild.id}/diffs/${diff!.id}.png`,
      );

      const baseline = await dbClient.baselines.find({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-d",
      });
      expect(baseline?.snapshotId).toBe(captureSnapshotRow!.id);

      expect(await metrics.scrape()).toContain('ovr_diffs_compared_total{result="changed"} 1');
    });

    test("promotes the baseline and saves a diff image for a main-branch build whose diff is below the review threshold", async ({
      mainBuild,
      project,
      captureConfiguration,
    }) => {
      const baselinePath = `builds/${mainBuild.id}/snapshots/main-baseline-speckle.png`;
      const capturePath = `builds/${mainBuild.id}/snapshots/main-capture-speckle.png`;
      await uploadSpeckledPng(baselinePath, 0, 0);
      await uploadSpeckledPng(capturePath, 0, 255);

      const [baselineSnapshot, captureSnapshotRow] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-e",
            status: "success",
            imagePath: baselinePath,
          },
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-e",
            status: "success",
            imagePath: capturePath,
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-e",
        snapshotId: baselineSnapshot!.id,
        approvedBy: mainBuild.createdBy,
      });
      const diff = await dbClient.diffs.create({ snapshotId: captureSnapshotRow!.id });

      await diffSnapshot(captureSnapshotRow!.id, diff!.id);

      const result = await dbClient.diffs.findById(diff!.id);
      expect(result).toMatchObject({ processingStatus: "success", reviewStatus: "unchanged" });
      expect(result!.pixelDiffCount).toBeGreaterThan(0);
      expect(result!.diffImagePath).toBe(
        `${mainBuild.projectId}/builds/${mainBuild.id}/diffs/${diff!.id}.png`,
      );

      const baseline = await dbClient.baselines.find({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-e",
      });
      expect(baseline?.snapshotId).toBe(captureSnapshotRow!.id);
    });

    test("marks the diff as errored without comparing pixels when the snapshot failed to render", async ({
      featureBuild,
      captureConfiguration,
      metrics,
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

      expect(await metrics.scrape()).toContain('ovr_diffs_compared_total{result="error"} 1');
    });
  });

  describe("snapshot variants", () => {
    test("groups a main-branch capture that returns to an earlier look with that earlier capture", async ({
      mainBuild,
      captureConfiguration,
      user,
    }) => {
      await enableFlakyDetection(user.id);

      const first = await diffCapture(mainBuild, captureConfiguration, "story-flip", (path) =>
        uploadPng(path, 0),
      );
      const second = await diffCapture(mainBuild, captureConfiguration, "story-flip", (path) =>
        uploadPng(path, 255),
      );
      const third = await diffCapture(mainBuild, captureConfiguration, "story-flip", (path) =>
        uploadPng(path, 0),
      );

      expect(first.variantId).not.toBeNull();
      expect(second.variantId).not.toBeNull();
      expect(second.variantId).not.toBe(first.variantId);
      expect(third.variantId).toBe(first.variantId);
    });

    test("groups a main-branch capture with an earlier look it matches within the diff threshold, even when the pixels are not identical", async ({
      mainBuild,
      captureConfiguration,
      user,
    }) => {
      await enableFlakyDetection(user.id);

      const first = await diffCapture(mainBuild, captureConfiguration, "story-noise", (path) =>
        uploadSpeckledPng(path, 0, 0),
      );
      await diffCapture(mainBuild, captureConfiguration, "story-noise", (path) =>
        uploadSpeckledPng(path, 255, 255),
      );
      const third = await diffCapture(mainBuild, captureConfiguration, "story-noise", (path) =>
        uploadSpeckledPng(path, 0, 255),
      );

      expect(third.imageHash).not.toBe(first.imageHash);
      expect(third.variantId).toBe(first.variantId);
    });

    test("does not mark a feature-branch change that matches a look the story had earlier on main", async ({
      mainBuild,
      featureBuild,
      captureConfiguration,
      user,
    }) => {
      await enableFlakyDetection(user.id);

      await diffCapture(mainBuild, captureConfiguration, "story-pr-flip", (path) =>
        uploadPng(path, 0),
      );
      await diffCapture(mainBuild, captureConfiguration, "story-pr-flip", (path) =>
        uploadPng(path, 255),
      );
      const featureSnapshot = await diffCapture(
        featureBuild,
        captureConfiguration,
        "story-pr-flip",
        (path) => uploadPng(path, 0),
      );

      expect(await dbClient.diffs.findBySnapshot(featureSnapshot.id)).toMatchObject({
        reviewStatus: "needs_review",
        matchedVariantId: null,
      });
    });

    test("does not record variants for feature-branch captures", async ({
      featureBuild,
      captureConfiguration,
      user,
    }) => {
      await enableFlakyDetection(user.id);

      const snapshot = await diffCapture(featureBuild, captureConfiguration, "story-pr", (path) =>
        uploadPng(path, 0),
      );

      expect(snapshot.variantId).toBeNull();
    });

    test("does not record variants when flaky detection is disabled", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      const snapshot = await diffCapture(mainBuild, captureConfiguration, "story-off", (path) =>
        uploadPng(path, 0),
      );

      expect(snapshot.variantId).toBeNull();
    });
  });
});
