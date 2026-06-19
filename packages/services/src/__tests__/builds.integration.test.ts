import assert from "node:assert";

import { Worker } from "bullmq";
import type { Redis } from "ioredis";

import { dbClient } from "@ovr/db/client";
import type { DiffProcessingStatus, DiffReviewStatus } from "@ovr/db/schema";
import { QueueName, type ExtractJobPayload } from "@ovr/queue";

import { createBuild, finalizeBuild, getArtifactPath } from "../builds";
import { describe, expect, test } from "./fixtures";

const collectExtractJob = async (connection: Redis): Promise<ExtractJobPayload> => {
  const worker = new Worker<ExtractJobPayload>(QueueName.BUILD_EXTRACT, async (job) => job.data, {
    connection,
  });

  try {
    return await new Promise<ExtractJobPayload>((resolve, reject) => {
      worker.on("completed", (job) => resolve(job.data));
      worker.on("failed", (_job, error) => reject(error));
    });
  } finally {
    await worker.close();
  }
};

type SeedDiffStatus = { processingStatus: DiffProcessingStatus; reviewStatus: DiffReviewStatus };

const seedDiffs = async (
  buildId: string,
  captureConfigurationId: string,
  statuses: SeedDiffStatus[],
) => {
  for (const status of statuses) {
    const [snapshot] = await dbClient.snapshots.createMany({
      values: [
        { buildId, captureConfigurationId, targetId: crypto.randomUUID(), status: "captured" },
      ],
    });
    await dbClient.diffs.create({ snapshotId: snapshot!.id, ...status });
  }
};

describe("builds", () => {
  describe("createBuild", () => {
    test("creates a pending build with a snapshot per target x capture configuration, and enqueues an extract job", async ({
      project,
      captureConfiguration,
      user,
      connection,
    }) => {
      const result = await createBuild(
        {
          projectId: project.id,
          branch: "main",
          commitSha: "a".repeat(40),
          targets: [
            { id: "story-a", title: "Story", name: "A" },
            { id: "story-b", title: "Story", name: "B" },
          ],
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
        artifactPath: getArtifactPath(buildId),
        createdBy: user.id,
      });

      const snapshots = await dbClient.snapshots.findByBuild(buildId);
      expect(snapshots.map((snapshot) => snapshot.targetId).sort()).toEqual(["story-a", "story-b"]);
      expect(
        snapshots.every((snapshot) => snapshot.captureConfigurationId === captureConfiguration.id),
      ).toBe(true);

      const job = await collectExtractJob(connection);
      expect(job).toEqual({ buildId, artifactPath: getArtifactPath(buildId) });
    });

    test("returns PROJECT_NOT_FOUND when the project does not exist", async ({ user }) => {
      const result = await createBuild(
        {
          projectId: crypto.randomUUID(),
          branch: "main",
          commitSha: "a".repeat(40),
          targets: [{ id: "story-a", title: "Story", name: "A" }],
        },
        user.id,
      );

      expect(result).toEqual({ status: "error", error: "PROJECT_NOT_FOUND" });
    });
  });

  describe("finalizeBuild", () => {
    test("marks the build as error when any diff errored", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration.id, [
        { processingStatus: "diffed", reviewStatus: "not_required" },
        { processingStatus: "error", reviewStatus: "not_required" },
      ]);

      await finalizeBuild(mainBuild.id);

      expect((await dbClient.builds.findById(mainBuild.id))?.status).toBe("error");
    });

    test("marks the build as needs_review when any diff needs review", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration.id, [
        { processingStatus: "diffed", reviewStatus: "not_required" },
        { processingStatus: "diffed", reviewStatus: "needs_review" },
      ]);

      await finalizeBuild(mainBuild.id);

      expect((await dbClient.builds.findById(mainBuild.id))?.status).toBe("needs_review");
    });

    test("marks the build as rejected when any diff is rejected, even if others need review", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration.id, [
        { processingStatus: "diffed", reviewStatus: "needs_review" },
        { processingStatus: "diffed", reviewStatus: "rejected" },
      ]);

      await finalizeBuild(mainBuild.id);

      expect((await dbClient.builds.findById(mainBuild.id))?.status).toBe("rejected");
    });

    test("marks the build as rejected ahead of needs_review when both are present", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration.id, [
        { processingStatus: "diffed", reviewStatus: "rejected" },
        { processingStatus: "diffed", reviewStatus: "needs_review" },
      ]);

      await finalizeBuild(mainBuild.id);

      expect((await dbClient.builds.findById(mainBuild.id))?.status).toBe("rejected");
    });

    test("marks the build as passed when all diffs are not_required or approved", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration.id, [
        { processingStatus: "diffed", reviewStatus: "not_required" },
        { processingStatus: "diffed", reviewStatus: "approved" },
      ]);

      await finalizeBuild(mainBuild.id);

      expect((await dbClient.builds.findById(mainBuild.id))?.status).toBe("passed");
    });

    test("marks the build as passed when there are no diffs", async ({ mainBuild }) => {
      await finalizeBuild(mainBuild.id);

      expect((await dbClient.builds.findById(mainBuild.id))?.status).toBe("passed");
    });
  });
});
