import { Worker } from "bullmq";
import type { Redis } from "ioredis";
import { PNG } from "pngjs";

import { dbClient } from "@ovr/db/client";
import { QueueName, type DiffJobPayload } from "@ovr/queue";
import { storage } from "@ovr/storage";

import { getStaticPath } from "../extract";
import { captureSnapshot, diffSnapshot } from "../snapshots";
import { describe, expect, test } from "./fixtures";

const IFRAME_HTML = `<!doctype html><html><body><div id="storybook-root" hidden="true"></div>
<script>
  window.__STORYBOOK_ADDONS_CHANNEL__ = {
    _l: {},
    on(e, l) { (this._l[e] ??= []).push(l); },
    off(e, l) { this._l[e] = (this._l[e] || []).filter((x) => x !== l); },
    emit(e, payload) {
      if (e === "setCurrentStory") {
        document.getElementById("storybook-root").textContent = "rendered: " + payload.storyId;
        (this._l["storyRendered"] || []).forEach((l) => l(payload));
      }
    },
  };
</script>
</body></html>`;

const uploadStaticBuild = async (buildId: string): Promise<void> => {
  await storage.uploadFile(
    getStaticPath(buildId, "iframe.html"),
    Buffer.from(IFRAME_HTML),
    "text/html",
  );
  await storage.uploadFile(
    getStaticPath(buildId, "index.json"),
    Buffer.from(JSON.stringify({ v: 3, entries: {} })),
    "application/json",
  );
};

const uploadPng = async (path: string, fill: number): Promise<void> => {
  const png = new PNG({ width: 2, height: 2 });
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
  describe("captureSnapshot", () => {
    test("captures a real screenshot, marks the snapshot captured, and enqueues a diff job when last in build", async ({
      build,
      captureConfiguration,
      connection,
    }) => {
      await uploadStaticBuild(build.id);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            captureConfigurationId: captureConfiguration.id,
            targetId: "story-a",
          },
        ],
      });

      await captureSnapshot(snapshot!.id);

      const captured = await dbClient.snapshots.findById(snapshot!.id);
      expect(captured).toMatchObject({ status: "captured", hasRenderError: false });
      expect(captured!.imagePath).toBe(`builds/${build.id}/snapshots/${snapshot!.id}.png`);

      const imageStream = await storage.getFileStream(captured!.imagePath!);
      expect(imageStream).toBeDefined();

      const job = await collectDiffJob(connection);
      expect(job.snapshotId).toBe(snapshot!.id);
    }, 30000);

    test("records hasRenderError when the story fails to render", async ({
      build,
      captureConfiguration,
    }) => {
      await storage.uploadFile(
        getStaticPath(build.id, "iframe.html"),
        Buffer.from(
          '<!doctype html><html><body><div id="storybook-root" hidden="true"></div></body></html>',
        ),
        "text/html",
      );
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            captureConfigurationId: captureConfiguration.id,
            targetId: "story-a",
          },
        ],
      });

      await captureSnapshot(snapshot!.id);

      const captured = await dbClient.snapshots.findById(snapshot!.id);
      expect(captured).toMatchObject({ status: "captured", hasRenderError: true });

      const logs = await dbClient.snapshotLogs.findBySnapshot(snapshot!.id);
      expect(logs.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe("diffSnapshot", () => {
    test("marks needs_review when there is no baseline, and enqueues finalize when last diff", async ({
      build,
      captureConfiguration,
      connection,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            captureConfigurationId: captureConfiguration.id,
            targetId: "story-a",
            status: "captured",
            imagePath: `builds/${build.id}/snapshots/no-baseline.png`,
          },
        ],
      });
      await uploadPng(snapshot!.imagePath!, 255);
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await diffSnapshot(snapshot!.id, diff!.id);

      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({ status: "needs_review" });

      const worker = new Worker(QueueName.BUILD_FINALIZE, async (job) => job.data, { connection });
      try {
        await new Promise((resolve, reject) => {
          worker.on("completed", resolve);
          worker.on("failed", (_job, error) => reject(error));
        });
      } finally {
        await worker.close();
      }
    }, 30000);

    test("marks auto_approved when the capture matches the baseline within threshold", async ({
      build,
      project,
      captureConfiguration,
    }) => {
      const baselinePath = `builds/${build.id}/snapshots/baseline.png`;
      const capturePath = `builds/${build.id}/snapshots/capture.png`;
      await uploadPng(baselinePath, 255);
      await uploadPng(capturePath, 255);

      const [baselineSnapshot, captureSnapshotRow] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            captureConfigurationId: captureConfiguration.id,
            targetId: "story-a",
            status: "captured",
            imagePath: baselinePath,
          },
          {
            buildId: build.id,
            captureConfigurationId: captureConfiguration.id,
            targetId: "story-a",
            status: "captured",
            imagePath: capturePath,
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        captureConfigurationId: captureConfiguration.id,
        targetId: "story-a",
        snapshotId: baselineSnapshot!.id,
        approvedBy: build.createdBy,
      });
      const diff = await dbClient.diffs.create({ snapshotId: captureSnapshotRow!.id });

      await diffSnapshot(captureSnapshotRow!.id, diff!.id);

      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        status: "auto_approved",
        pixelDiffCount: 0,
        diffPercent: 0,
      });
    }, 30000);

    test("marks needs_review and uploads a diff image when the capture exceeds the threshold", async ({
      build,
      project,
      captureConfiguration,
    }) => {
      const baselinePath = `builds/${build.id}/snapshots/baseline-2.png`;
      const capturePath = `builds/${build.id}/snapshots/capture-2.png`;
      await uploadPng(baselinePath, 0);
      await uploadPng(capturePath, 255);

      const [baselineSnapshot, captureSnapshotRow] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            captureConfigurationId: captureConfiguration.id,
            targetId: "story-b",
            status: "captured",
            imagePath: baselinePath,
          },
          {
            buildId: build.id,
            captureConfigurationId: captureConfiguration.id,
            targetId: "story-b",
            status: "captured",
            imagePath: capturePath,
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        captureConfigurationId: captureConfiguration.id,
        targetId: "story-b",
        snapshotId: baselineSnapshot!.id,
        approvedBy: build.createdBy,
      });
      const diff = await dbClient.diffs.create({ snapshotId: captureSnapshotRow!.id });

      await diffSnapshot(captureSnapshotRow!.id, diff!.id);

      const result = await dbClient.diffs.findById(diff!.id);
      expect(result).toMatchObject({ status: "needs_review" });
      expect(result!.diffImagePath).toBe(`builds/${build.id}/diffs/${diff!.id}.png`);
      expect(result!.pixelDiffCount).toBeGreaterThan(0);

      const diffImage = await storage.getFileStream(result!.diffImagePath!);
      expect(diffImage).toBeDefined();
    }, 30000);
  });
});
