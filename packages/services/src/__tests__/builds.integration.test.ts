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
type Viewport = { browser: string; viewportWidth: number; viewportHeight: number };

const seedDiffs = async (buildId: string, viewport: Viewport, statuses: SeedDiffStatus[]) => {
  for (const status of statuses) {
    const [snapshot] = await dbClient.snapshots.createMany({
      values: [{ buildId, ...viewport, targetId: crypto.randomUUID(), status: "captured" }],
    });
    await dbClient.diffs.create({ snapshotId: snapshot!.id, ...status });
  }
};

describe("builds", () => {
  describe("createBuild", () => {
    test("creates a pending build and enqueues an extract job with the targets and viewports", async ({
      project,
      captureConfiguration,
      user,
      connection,
    }) => {
      const targets = [
        { id: "story-a", title: "Story", name: "A" },
        { id: "story-b", title: "Story", name: "B" },
      ];

      const result = await createBuild(
        {
          projectId: project.id,
          branch: "main",
          commitSha: "a".repeat(40),
          targets,
          viewports: [captureConfiguration],
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

      const job = await collectExtractJob(connection);
      expect(job).toEqual({
        buildId,
        artifactPath: getArtifactPath(buildId),
        targets,
        viewports: [captureConfiguration],
      });
    });

    test("returns PROJECT_NOT_FOUND when the project does not exist", async ({ user }) => {
      const result = await createBuild(
        {
          projectId: crypto.randomUUID(),
          branch: "main",
          commitSha: "a".repeat(40),
          targets: [{ id: "story-a", title: "Story", name: "A" }],
          viewports: [{ browser: "chromium", viewportWidth: 1280, viewportHeight: 800 }],
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
      await seedDiffs(mainBuild.id, captureConfiguration, [
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
      await seedDiffs(mainBuild.id, captureConfiguration, [
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
      await seedDiffs(mainBuild.id, captureConfiguration, [
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
      await seedDiffs(mainBuild.id, captureConfiguration, [
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
      await seedDiffs(mainBuild.id, captureConfiguration, [
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
