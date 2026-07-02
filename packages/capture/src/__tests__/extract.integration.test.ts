import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Worker } from "bullmq";
import type { Redis } from "ioredis";
import * as tar from "tar";

import { dbClient } from "@ovr/db/client";
import { QueueName, type CaptureGroupJobPayload } from "@ovr/queue";
import { storage } from "@ovr/storage";

import { extractBuild } from "../extract";
import { describe, expect, test } from "./fixtures";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const IFRAME_TEMPLATE = await readFile(path.join(TEST_DIR, "html/iframe-template.html"), "utf-8");

const collectCaptureGroupJobs = async (
  connection: Redis,
  count: number,
): Promise<CaptureGroupJobPayload[]> => {
  const worker = new Worker<CaptureGroupJobPayload>(
    QueueName.SNAPSHOT_CAPTURE,
    async (job) => job.data,
    { connection },
  );

  try {
    return await new Promise<CaptureGroupJobPayload[]>((resolve, reject) => {
      const jobs: CaptureGroupJobPayload[] = [];

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
  });

  test("marks a story's snapshot as errored when its overrides cannot be read", async ({
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
    expect(logs.some((log) => log.level === "error")).toBe(true);
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

  test("skips creating snapshots for a story with parameters.ovr.skip set", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    const tarball = await buildArtifactTarball({ "story-a": { skip: true } });
    await storage.uploadFile(mainBuild.artifactPath, tarball, "application/gzip");

    const targets = [
      { id: "story-a", title: "Story", name: "A" },
      { id: "story-b", title: "Story", name: "B" },
    ];

    await extractBuild(mainBuild.id, targets, [captureConfiguration], 0.05);

    const snapshots = await dbClient.snapshots.findByBuild(mainBuild.id);
    expect(snapshots.map((snapshot) => snapshot.targetId)).toEqual(["story-b"]);
  });
});
