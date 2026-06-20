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
    test("should let a reviewer see a screenshot of the story, and move the build toward a diff once every story in the build has been captured", async ({
      mainBuild,
      captureConfiguration,
      connection,
    }) => {
      await uploadStaticBuild(mainBuild.id);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
          },
        ],
      });

      await captureSnapshot(snapshot!.id);

      const captured = await dbClient.snapshots.findById(snapshot!.id);
      expect(captured).toMatchObject({ status: "captured", hasRenderError: false });
      expect(captured!.imagePath).toBe(
        `${mainBuild.projectId}/builds/${mainBuild.id}/snapshots/${snapshot!.id}.png`,
      );

      const imageStream = await storage.getFileStream(captured!.imagePath!);
      expect(imageStream).toBeDefined();

      const job = await collectDiffJob(connection);
      expect(job.snapshotId).toBe(snapshot!.id);
    }, 30000);

    test("should still let a reviewer see the story, flagged as a render error, when the story fails to render", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await storage.uploadFile(
        getStaticPath(mainBuild.id, "iframe.html"),
        Buffer.from(
          '<!doctype html><html><body><div id="storybook-root" hidden="true"></div></body></html>',
        ),
        "text/html",
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

      await captureSnapshot(snapshot!.id);

      const captured = await dbClient.snapshots.findById(snapshot!.id);
      expect(captured).toMatchObject({ status: "captured", hasRenderError: true });

      const logs = await dbClient.snapshotLogs.findBySnapshot(snapshot!.id);
      expect(logs.length).toBeGreaterThan(0);
    }, 30000);
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
            status: "captured",
            imagePath: `builds/${featureBuild.id}/snapshots/no-baseline.png`,
          },
        ],
      });
      await uploadPng(snapshot!.imagePath!, 255);
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await diffSnapshot(snapshot!.id, diff!.id);

      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        processingStatus: "diffed",
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
    }, 30000);

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
            status: "captured",
            imagePath: baselinePath,
          },
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
            status: "captured",
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
        processingStatus: "diffed",
        reviewStatus: "not_required",
        pixelDiffCount: 0,
        diffPercent: 0,
      });
    }, 30000);

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
            status: "captured",
            imagePath: baselinePath,
          },
          {
            buildId: featureBuild.id,
            ...captureConfiguration,
            targetId: "story-b",
            status: "captured",
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
      expect(result).toMatchObject({ processingStatus: "diffed", reviewStatus: "needs_review" });
      expect(result!.diffImagePath).toBe(
        `${featureBuild.projectId}/builds/${featureBuild.id}/diffs/${diff!.id}.png`,
      );
      expect(result!.pixelDiffCount).toBeGreaterThan(0);

      const diffImage = await storage.getFileStream(result!.diffImagePath!);
      expect(diffImage).toBeDefined();
    }, 30000);

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
            status: "captured",
            imagePath: capturePath,
          },
        ],
      });
      const diff = await dbClient.diffs.create({ snapshotId: captureSnapshotRow!.id });

      await diffSnapshot(captureSnapshotRow!.id, diff!.id);

      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        processingStatus: "diffed",
        reviewStatus: "not_required",
      });

      const baseline = await dbClient.baselines.find({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-c",
      });
      expect(baseline?.snapshotId).toBe(captureSnapshotRow!.id);
    }, 30000);

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
            status: "captured",
            imagePath: baselinePath,
          },
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-d",
            status: "captured",
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
        processingStatus: "diffed",
        reviewStatus: "not_required",
      });
      expect(result!.pixelDiffCount).toBeGreaterThan(0);

      const baseline = await dbClient.baselines.find({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-d",
      });
      expect(baseline?.snapshotId).toBe(captureSnapshotRow!.id);
    }, 30000);
  });
});
