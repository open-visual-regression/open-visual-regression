import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Worker } from "bullmq";
import * as tar from "tar";

import { dbClient } from "@ovr/db/client";
import {
  QueueName,
  type RedisConnection,
  type CaptureGroupJobPayload,
  type FinalizeJobPayload,
} from "@ovr/queue";
import { storage } from "@ovr/storage";

import { extractBuild } from "../extract";
import { describe, expect, test, writeStorybookBuildMarkers } from "./fixtures";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const IFRAME_TEMPLATE = await readFile(path.join(TEST_DIR, "html/iframe-template.html"), "utf-8");

const collectJobs = async <T>(
  connection: RedisConnection,
  queueName: QueueName,
  count: number,
): Promise<T[]> => {
  const worker = new Worker<T>(queueName, async (job) => job.data, { connection });

  try {
    return await new Promise<T[]>((resolve, reject) => {
      const jobs: T[] = [];

      worker.on("completed", (job) => {
        jobs.push(job.data);
        if (jobs.length === count) {
          resolve(jobs);
        }
      });

      worker.on("failed", (_job, error) => reject(error));
    });
  } finally {
    await worker.close();
  }
};

const collectCaptureGroupJobs = (
  connection: RedisConnection,
  count: number,
): Promise<CaptureGroupJobPayload[]> =>
  collectJobs<CaptureGroupJobPayload>(connection, QueueName.SNAPSHOT_CAPTURE, count);

const buildArtifactTarball = async (
  storyParameters: Record<
    string,
    { viewports?: string[]; diffThreshold?: number; skip?: boolean; __throw?: boolean }
  > = {},
): Promise<Buffer> => {
  const sourceDir = await mkdtemp(path.join(tmpdir(), "ovr-extract-fixture-"));

  try {
    await writeFile(
      path.join(sourceDir, "iframe.html"),
      IFRAME_TEMPLATE.replace('"__OVR_STORY_PARAMETERS_JSON__"', JSON.stringify(storyParameters)),
    );
    await writeFile(path.join(sourceDir, "runtime.js"), "console.log('hi')");
    await writeStorybookBuildMarkers(sourceDir);

    const tarballPath = path.join(sourceDir, "..", `${path.basename(sourceDir)}.tar.gz`);
    await tar.create({ gzip: true, file: tarballPath, cwd: sourceDir }, ["."]);

    const { readFile } = await import("node:fs/promises");
    const buffer = await readFile(tarballPath);
    await rm(tarballPath, { force: true });
    return buffer;
  } finally {
    await rm(sourceDir, { recursive: true, force: true });
  }
};

describe("extractBuild", () => {
  test("creates a snapshot per target x viewport and enqueues one capture-group job per browser", async ({
    mainBuild,
    captureConfiguration,
    connection,
  }) => {
    const tarball = await buildArtifactTarball();
    await storage.uploadFile(mainBuild.artifactPath, tarball, "application/gzip");

    const targets = [
      { id: "story-a", title: "Story", name: "A" },
      { id: "story-b", title: "Story", name: "B" },
    ];

    await extractBuild(mainBuild.id, targets, [captureConfiguration], 0.05);

    const snapshots = await dbClient.snapshots.findByBuild(mainBuild.id);
    expect(snapshots).toHaveLength(2);
    expect(snapshots.map((snapshot) => snapshot.targetId).sort()).toEqual(["story-a", "story-b"]);
    expect(snapshots.every((snapshot) => snapshot.browser === captureConfiguration.browser)).toBe(
      true,
    );

    const [job] = await collectCaptureGroupJobs(connection, 1);
    expect(job).toEqual({
      buildId: mainBuild.id,
      browser: captureConfiguration.browser,
      snapshotIds: expect.arrayContaining(snapshots.map((snapshot) => snapshot.id)),
    });
    expect(job!.snapshotIds).toHaveLength(2);
  });

  test("resolves a story's parameters.ovr.viewports override into one snapshot per named viewport", async ({
    mainBuild,
  }) => {
    const tarball = await buildArtifactTarball({ "story-a": { viewports: ["mobile"] } });
    await storage.uploadFile(mainBuild.artifactPath, tarball, "application/gzip");

    const viewports = [
      {
        name: "desktop",
        browser: "chromium",
        viewportWidth: 1280,
        viewportHeight: 0,
        default: true,
      },
      { name: "mobile", browser: "chromium", viewportWidth: 375, viewportHeight: 0 },
    ];

    await extractBuild(
      mainBuild.id,
      [{ id: "story-a", title: "Story", name: "A" }],
      viewports,
      0.05,
    );

    const snapshots = await dbClient.snapshots.findByBuild(mainBuild.id);
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]!.viewportWidth).toBe(375);
    expect(snapshots[0]!.viewportName).toBe("mobile");
  });

  test("falls back to a '{width}x{height}' viewport name when the config doesn't name it", async ({
    mainBuild,
  }) => {
    const tarball = await buildArtifactTarball();
    await storage.uploadFile(mainBuild.artifactPath, tarball, "application/gzip");

    await extractBuild(
      mainBuild.id,
      [{ id: "story-a", title: "Story", name: "A" }],
      [{ browser: "chromium", viewportWidth: 1280, viewportHeight: 0 }],
      0.05,
    );

    const [snapshot] = await dbClient.snapshots.findByBuild(mainBuild.id);
    expect(snapshot!.viewportName).toBe("1280xauto");
  });

  test("marks a story's snapshot as errored when the story fails to load", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    const tarball = await buildArtifactTarball({ "story-a": { __throw: true } });
    await storage.uploadFile(mainBuild.artifactPath, tarball, "application/gzip");

    await extractBuild(
      mainBuild.id,
      [{ id: "story-a", title: "Story", name: "A" }],
      [captureConfiguration],
      0.05,
    );

    const [snapshot] = await dbClient.snapshots.findByBuild(mainBuild.id);
    expect(snapshot).toMatchObject({ targetId: "story-a", status: "error" });

    const logs = await dbClient.snapshotLogs.findBySnapshot(snapshot!.id);
    expect(logs).toContainEqual(
      expect.objectContaining({
        level: "error",
        message: expect.stringContaining("failed to load"),
      }),
    );
  });

  test("captures the readable stories while excluding an unreadable one from the group", async ({
    mainBuild,
    captureConfiguration,
    connection,
  }) => {
    const tarball = await buildArtifactTarball({ "story-bad": { __throw: true } });
    await storage.uploadFile(mainBuild.artifactPath, tarball, "application/gzip");

    await extractBuild(
      mainBuild.id,
      [
        { id: "story-good", title: "Story", name: "Good" },
        { id: "story-bad", title: "Story", name: "Bad" },
      ],
      [captureConfiguration],
      0.05,
    );

    const snapshots = await dbClient.snapshots.findByBuild(mainBuild.id);
    const statusByTarget = Object.fromEntries(snapshots.map((s) => [s.targetId, s.status]));
    expect(statusByTarget["story-bad"]).toBe("error");
    expect(statusByTarget["story-good"]).toBe("queued");

    const goodSnapshot = snapshots.find((s) => s.targetId === "story-good");
    const [job] = await collectCaptureGroupJobs(connection, 1);
    expect(job!.snapshotIds).toEqual([goodSnapshot!.id]);
  });

  test("uses the build default diff threshold when a story has no override", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    const tarball = await buildArtifactTarball();
    await storage.uploadFile(mainBuild.artifactPath, tarball, "application/gzip");

    await extractBuild(
      mainBuild.id,
      [{ id: "story-a", title: "Story", name: "A" }],
      [captureConfiguration],
      0.1,
    );

    const [snapshot] = await dbClient.snapshots.findByBuild(mainBuild.id);
    expect(snapshot!.diffThreshold).toBe(0.1);
  });

  test("resolves a story's parameters.ovr.diffThreshold override onto its snapshots", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    const tarball = await buildArtifactTarball({ "story-a": { diffThreshold: 0.2 } });
    await storage.uploadFile(mainBuild.artifactPath, tarball, "application/gzip");

    await extractBuild(
      mainBuild.id,
      [{ id: "story-a", title: "Story", name: "A" }],
      [captureConfiguration],
      0.1,
    );

    const [snapshot] = await dbClient.snapshots.findByBuild(mainBuild.id);
    expect(snapshot!.diffThreshold).toBe(0.2);
  });

  test("marks a story with parameters.ovr.skip as skipped instead of capturing it", async ({
    mainBuild,
    captureConfiguration,
    connection,
  }) => {
    const tarball = await buildArtifactTarball({ "story-a": { skip: true } });
    await storage.uploadFile(mainBuild.artifactPath, tarball, "application/gzip");

    const targets = [
      { id: "story-a", title: "Story", name: "A" },
      { id: "story-b", title: "Story", name: "B" },
    ];

    await extractBuild(mainBuild.id, targets, [captureConfiguration], 0.05);

    const snapshots = await dbClient.snapshots.findByBuild(mainBuild.id);
    const statusByTarget = Object.fromEntries(
      snapshots.map((snapshot) => [snapshot.targetId, snapshot.status]),
    );
    expect(statusByTarget).toEqual({ "story-a": "skipped", "story-b": "queued" });

    const [job] = await collectCaptureGroupJobs(connection, 1);
    expect(job!.snapshotIds).toEqual([
      snapshots.find((snapshot) => snapshot.targetId === "story-b")!.id,
    ]);
  });

  test("creates one skipped snapshot per story, not one per viewport", async ({ mainBuild }) => {
    const tarball = await buildArtifactTarball({ "story-a": { skip: true } });
    await storage.uploadFile(mainBuild.artifactPath, tarball, "application/gzip");

    const viewports = [
      { name: "desktop", browser: "chromium", viewportWidth: 1280, viewportHeight: 0 },
      { name: "mobile", browser: "chromium", viewportWidth: 390, viewportHeight: 0 },
    ];

    await extractBuild(
      mainBuild.id,
      [{ id: "story-a", title: "Story", name: "A" }],
      viewports,
      0.05,
    );

    const snapshots = await dbClient.snapshots.findByBuild(mainBuild.id);
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({ status: "skipped", viewportName: "desktop" });
  });

  test("finalizes a build when every story is skipped, instead of leaving it processing", async ({
    mainBuild,
    captureConfiguration,
    connection,
  }) => {
    const tarball = await buildArtifactTarball({
      "story-a": { skip: true },
      "story-b": { skip: true },
    });
    await storage.uploadFile(mainBuild.artifactPath, tarball, "application/gzip");

    const targets = [
      { id: "story-a", title: "Story", name: "A" },
      { id: "story-b", title: "Story", name: "B" },
    ];

    await extractBuild(mainBuild.id, targets, [captureConfiguration], 0.05);

    const snapshots = await dbClient.snapshots.findByBuild(mainBuild.id);
    expect(snapshots.every((snapshot) => snapshot.status === "skipped")).toBe(true);

    const [job] = await collectJobs<FinalizeJobPayload>(connection, QueueName.BUILD_FINALIZE, 1);
    expect(job).toEqual({ buildId: mainBuild.id });
  });

  describe("unaffected targets", () => {
    const seedBaseline = async (
      build: { id: string; projectId: string; createdBy: string },
      targetId: string,
      viewport: { browser: string; viewportWidth: number; viewportHeight: number },
    ): Promise<void> => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...viewport,
            viewportName: "baseline",
            targetId,
            targetTitle: "Story",
            targetName: targetId,
            status: "success",
            diffThreshold: 0.05,
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: build.projectId,
        ...viewport,
        targetId,
        snapshotId: snapshot!.id,
        approvedBy: build.createdBy,
      });
    };

    const desktop = { browser: "chromium", viewportWidth: 1280, viewportHeight: 0 };
    const mobile = { browser: "chromium", viewportWidth: 390, viewportHeight: 0 };
    const viewports = [
      { name: "desktop", ...desktop },
      { name: "mobile", ...mobile },
    ];
    const targets = [
      { id: "story-a", title: "Story", name: "A" },
      { id: "story-b", title: "Story", name: "B" },
    ];

    test("keeps the baselines of an unaffected target by skipping each of its viewports", async ({
      mainBuild,
      featureBuild,
      connection,
    }) => {
      await seedBaseline(mainBuild, "story-a", desktop);
      await seedBaseline(mainBuild, "story-a", mobile);
      await storage.uploadFile(
        featureBuild.artifactPath,
        await buildArtifactTarball(),
        "application/gzip",
      );

      await extractBuild(featureBuild.id, targets, viewports, 0.05, ["story-a"]);

      const snapshots = await dbClient.snapshots.findByBuild(featureBuild.id);
      const statuses = snapshots
        .map((snapshot) => `${snapshot.targetId}@${snapshot.viewportName}:${snapshot.status}`)
        .sort();
      expect(statuses).toEqual([
        "story-a@desktop:skipped",
        "story-a@mobile:skipped",
        "story-b@desktop:queued",
        "story-b@mobile:queued",
      ]);

      const [job] = await collectCaptureGroupJobs(connection, 1);
      expect(job!.snapshotIds.sort()).toEqual(
        snapshots
          .filter((snapshot) => snapshot.targetId === "story-b")
          .map((snapshot) => snapshot.id)
          .sort(),
      );
    });

    test("captures an unaffected target on any viewport that has no baseline yet", async ({
      mainBuild,
      featureBuild,
    }) => {
      await seedBaseline(mainBuild, "story-a", desktop);
      await storage.uploadFile(
        featureBuild.artifactPath,
        await buildArtifactTarball(),
        "application/gzip",
      );

      await extractBuild(featureBuild.id, [targets[0]!], viewports, 0.05, ["story-a"]);

      const snapshots = await dbClient.snapshots.findByBuild(featureBuild.id);
      const statusByViewport = Object.fromEntries(
        snapshots.map((snapshot) => [snapshot.viewportName, snapshot.status]),
      );
      expect(statusByViewport).toEqual({ desktop: "skipped", mobile: "queued" });
    });

    test("does not use another project's baselines", async ({
      featureBuild,
      user,
      organization,
    }) => {
      const otherProject = await dbClient.projects.addProject({
        name: "Other",
        gitMainBranch: "main",
        organizationId: organization.id,
        creatorId: user.id,
      });
      const otherBuild = await dbClient.builds.create({
        projectId: otherProject!.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/other/artifact",
        createdBy: user.id,
      });
      await seedBaseline(otherBuild!, "story-a", desktop);
      await storage.uploadFile(
        featureBuild.artifactPath,
        await buildArtifactTarball(),
        "application/gzip",
      );

      await extractBuild(featureBuild.id, [targets[0]!], [viewports[0]!], 0.05, ["story-a"]);

      const [snapshot] = await dbClient.snapshots.findByBuild(featureBuild.id);
      expect(snapshot!.status).toBe("queued");
    });

    test("finalizes the build when every target is unaffected and has its baselines", async ({
      mainBuild,
      featureBuild,
      connection,
    }) => {
      await seedBaseline(mainBuild, "story-a", desktop);
      await storage.uploadFile(
        featureBuild.artifactPath,
        await buildArtifactTarball(),
        "application/gzip",
      );

      await extractBuild(featureBuild.id, [targets[0]!], [viewports[0]!], 0.05, ["story-a"]);

      const [job] = await collectJobs<FinalizeJobPayload>(connection, QueueName.BUILD_FINALIZE, 1);
      expect(job).toEqual({ buildId: featureBuild.id });
    });
  });
});
