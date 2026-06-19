import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { Worker } from "bullmq";
import type { Redis } from "ioredis";
import * as tar from "tar";

import { dbClient } from "@ovr/db/client";
import { QueueName, type CaptureJobPayload } from "@ovr/queue";
import { storage } from "@ovr/storage";

import { extractBuild, getStaticPath } from "../extract";
import { describe, expect, test } from "./fixtures";

const collectCaptureJobs = async (
  connection: Redis,
  count: number,
): Promise<CaptureJobPayload[]> => {
  const worker = new Worker<CaptureJobPayload>(
    QueueName.SNAPSHOT_CAPTURE,
    async (job) => job.data,
    { connection },
  );

  try {
    return await new Promise<CaptureJobPayload[]>((resolve, reject) => {
      const jobs: CaptureJobPayload[] = [];

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

const buildArtifactTarball = async (): Promise<Buffer> => {
  const sourceDir = await mkdtemp(path.join(tmpdir(), "ovr-extract-fixture-"));

  try {
    await writeFile(path.join(sourceDir, "iframe.html"), "<html></html>");
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
  test("uploads each file from the artifact tarball, creates a snapshot per target x viewport, and enqueues a capture job per snapshot", async ({
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

    await extractBuild(mainBuild.id, targets, [captureConfiguration]);

    const iframeStream = await storage.getFileStream(getStaticPath(mainBuild.id, "iframe.html"));
    const runtimeStream = await storage.getFileStream(getStaticPath(mainBuild.id, "runtime.js"));
    expect(iframeStream).toBeDefined();
    expect(runtimeStream).toBeDefined();

    const snapshots = await dbClient.snapshots.findByBuild(mainBuild.id);
    expect(snapshots).toHaveLength(2);
    expect(snapshots.map((snapshot) => snapshot.targetId).sort()).toEqual(["story-a", "story-b"]);
    expect(snapshots.every((snapshot) => snapshot.browser === captureConfiguration.browser)).toBe(
      true,
    );

    const jobs = await collectCaptureJobs(connection, snapshots.length);
    expect(jobs).toEqual(
      expect.arrayContaining(
        snapshots.map((snapshot) => ({ buildId: mainBuild.id, snapshotId: snapshot.id })),
      ),
    );
  }, 30000);
});
