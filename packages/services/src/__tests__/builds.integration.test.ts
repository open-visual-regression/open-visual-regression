import assert from "node:assert";

import { Worker } from "bullmq";
import type { Redis } from "ioredis";

import { dbClient } from "@ovr/db/client";
import type { DiffStatus } from "@ovr/db/schema";
import { QueueName, type CaptureJobPayload } from "@ovr/queue";
import { storage } from "@ovr/storage";

import { createBuild, finalizeBuild } from "../builds";
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

const seedDiffs = async (
  buildId: string,
  captureConfigurationId: string,
  statuses: DiffStatus[],
) => {
  for (const status of statuses) {
    const [snapshot] = await dbClient.snapshots.createMany([
      { buildId, captureConfigurationId, targetId: crypto.randomUUID(), status: "captured" },
    ]);
    await dbClient.diffs.create({ snapshotId: snapshot!.id, status });
  }
};

describe("builds", () => {
  describe("createBuild", () => {
    test("creates a pending build with a snapshot per target x capture configuration, uploads the artifact directory, and enqueues a capture job for each snapshot", async ({
      project,
      captureConfiguration,
      user,
      artifactDir,
      connection,
    }) => {
      const result = await createBuild(
        {
          projectId: project.id,
          branch: "main",
          commitSha: "a".repeat(40),
          targets: ["story-a", "story-b"],
          artifactDir,
        },
        user.id,
      );

      assert(result.status === "ok");

      const buildId = result.data;

      const build = await dbClient.builds.findById(buildId);
      expect(build).toMatchObject({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        status: "pending",
        captureMode: "worker",
        artifactPath: `builds/${buildId}/artifact`,
        createdBy: user.id,
      });

      const snapshots = await dbClient.snapshots.findByBuild(buildId);
      expect(snapshots.map((snapshot) => snapshot.targetId).sort()).toEqual(["story-a", "story-b"]);
      expect(
        snapshots.every((snapshot) => snapshot.captureConfigurationId === captureConfiguration.id),
      ).toBe(true);

      const uploaded = await storage.getFileStream(`builds/${buildId}/artifact/index.html`);
      expect(uploaded).toBeTruthy();
      uploaded.destroy();

      const jobs = await collectCaptureJobs(connection, snapshots.length);
      expect(jobs).toEqual(
        expect.arrayContaining(snapshots.map((snapshot) => ({ buildId, snapshotId: snapshot.id }))),
      );
    });

    test("returns PROJECT_NOT_FOUND when the project does not exist", async ({
      user,
      artifactDir,
    }) => {
      const result = await createBuild(
        {
          projectId: crypto.randomUUID(),
          branch: "main",
          commitSha: "a".repeat(40),
          targets: ["story-a"],
          artifactDir,
        },
        user.id,
      );

      expect(result).toEqual({ status: "error", error: "PROJECT_NOT_FOUND" });
    });

    test("marks the build as error and rethrows when the artifact directory cannot be uploaded", async ({
      project,
      user,
    }) => {
      await expect(
        createBuild(
          {
            projectId: project.id,
            branch: "main",
            commitSha: "a".repeat(40),
            targets: ["story-a"],
            artifactDir: `/nonexistent-${crypto.randomUUID()}`,
          },
          user.id,
        ),
      ).rejects.toThrow();

      const builds = await dbClient.builds.findByProject(project.id);
      expect(builds).toHaveLength(1);
      expect(builds[0]).toMatchObject({ status: "error" });
    });
  });

  describe("finalizeBuild", () => {
    test("marks the build as error when any diff errored", async ({
      build,
      captureConfiguration,
    }) => {
      await seedDiffs(build.id, captureConfiguration.id, ["auto_approved", "error"]);

      await finalizeBuild(build.id);

      expect((await dbClient.builds.findById(build.id))?.status).toBe("error");
    });

    test("marks the build as needs_review when any diff needs review", async ({
      build,
      captureConfiguration,
    }) => {
      await seedDiffs(build.id, captureConfiguration.id, ["auto_approved", "needs_review"]);

      await finalizeBuild(build.id);

      expect((await dbClient.builds.findById(build.id))?.status).toBe("needs_review");
    });

    test("marks the build as passed when all diffs are auto_approved or approved", async ({
      build,
      captureConfiguration,
    }) => {
      await seedDiffs(build.id, captureConfiguration.id, ["auto_approved", "approved"]);

      await finalizeBuild(build.id);

      expect((await dbClient.builds.findById(build.id))?.status).toBe("passed");
    });

    test("marks the build as passed when there are no diffs", async ({ build }) => {
      await finalizeBuild(build.id);

      expect((await dbClient.builds.findById(build.id))?.status).toBe("passed");
    });
  });
});
