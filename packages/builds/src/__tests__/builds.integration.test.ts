import assert from "node:assert";

import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import { dbClient } from "@ovr/db/client";
import type { DiffProcessingStatus, DiffReviewStatus } from "@ovr/db/schema";
import { QueueName, type ExtractJobPayload } from "@ovr/queue";
import { storage } from "@ovr/storage";

import { confirmBuildUpload, createBuild, finalizeBuild, getArtifactPath } from "../builds";
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

const findExtractJob = async (connection: Redis, buildId: string) => {
  const queue = new Queue(QueueName.BUILD_EXTRACT, { connection });
  try {
    return await queue.getJob(buildId);
  } finally {
    await queue.close();
  }
};

type SeedDiffStatus = { processingStatus: DiffProcessingStatus; reviewStatus: DiffReviewStatus };
type Viewport = { browser: string; viewportWidth: number; viewportHeight: number };

const seedDiffs = async (buildId: string, viewport: Viewport, statuses: SeedDiffStatus[]) => {
  for (const status of statuses) {
    const [snapshot] = await dbClient.snapshots.createMany({
      values: [{ buildId, ...viewport, targetId: crypto.randomUUID(), status: "success" }],
    });
    await dbClient.diffs.create({ snapshotId: snapshot!.id, ...status });
  }
};

describe("builds", () => {
  describe("createBuild", () => {
    test("creates a queued build without enqueuing an extract job", async ({
      project,
      user,
      connection,
    }) => {
      const result = await createBuild(
        { projectId: project.id, branch: "main", commitSha: "a".repeat(40) },
        user.id,
      );

      assert(result.status === "ok");

      const buildId = result.data;

      const build = await dbClient.builds.findById(buildId);
      expect(build).toMatchObject({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        processingStatus: "queued",
        reviewStatus: "not_required",
        captureMode: "worker",
        artifactPath: getArtifactPath(project.id, buildId),
        createdBy: user.id,
      });

      expect(await findExtractJob(connection, buildId)).toBeUndefined();
    });

    test("returns PROJECT_NOT_FOUND when the project does not exist", async ({ user }) => {
      const result = await createBuild(
        { projectId: crypto.randomUUID(), branch: "main", commitSha: "a".repeat(40) },
        user.id,
      );

      expect(result).toEqual({ status: "error", error: "PROJECT_NOT_FOUND" });
    });
  });

  describe("confirmBuildUpload", () => {
    test("enqueues an extract job with the targets and viewports once the artifact exists", async ({
      project,
      captureConfiguration,
      user,
      connection,
    }) => {
      const created = await createBuild(
        { projectId: project.id, branch: "main", commitSha: "a".repeat(40) },
        user.id,
      );
      assert(created.status === "ok");
      const buildId = created.data;

      await storage.uploadFile(
        getArtifactPath(project.id, buildId),
        Buffer.from(""),
        "application/gzip",
      );

      const targets = [
        { id: "story-a", title: "Story", name: "A" },
        { id: "story-b", title: "Story", name: "B" },
      ];

      const result = await confirmBuildUpload(buildId, {
        targets,
        viewports: [captureConfiguration],
        diffThreshold: 0.05,
      });

      expect(result).toEqual({ status: "ok", data: undefined });

      const job = await collectExtractJob(connection);
      expect(job).toEqual({
        buildId,
        artifactPath: getArtifactPath(project.id, buildId),
        targets,
        viewports: [captureConfiguration],
        diffThreshold: 0.05,
      });
    });

    test("returns ARTIFACT_MISSING and does not enqueue extract when the artifact was never uploaded", async ({
      project,
      captureConfiguration,
      user,
    }) => {
      const created = await createBuild(
        { projectId: project.id, branch: "main", commitSha: "a".repeat(40) },
        user.id,
      );
      assert(created.status === "ok");

      const result = await confirmBuildUpload(created.data, {
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: [captureConfiguration],
        diffThreshold: 0.05,
      });

      expect(result).toEqual({ status: "error", error: "ARTIFACT_MISSING" });
      expect(await dbClient.builds.findById(created.data)).toMatchObject({
        processingStatus: "queued",
      });
    });

    test("returns BUILD_NOT_FOUND when the build does not exist", async ({
      captureConfiguration,
    }) => {
      const result = await confirmBuildUpload(crypto.randomUUID(), {
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: [captureConfiguration],
        diffThreshold: 0.05,
      });

      expect(result).toEqual({ status: "error", error: "BUILD_NOT_FOUND" });
    });
  });

  describe("finalizeBuild", () => {
    test("marks the build as error when any diff errored", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration, [
        { processingStatus: "success", reviewStatus: "not_required" },
        { processingStatus: "error", reviewStatus: "not_required" },
      ]);

      await finalizeBuild(mainBuild.id);

      expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
        processingStatus: "error",
      });
    });

    test("marks the build's processing status as error ahead of review status when both are present", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration, [
        { processingStatus: "success", reviewStatus: "needs_review" },
        { processingStatus: "error", reviewStatus: "not_required" },
      ]);

      await finalizeBuild(mainBuild.id);

      expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
        processingStatus: "error",
        reviewStatus: "needs_review",
      });
    });

    test("marks the build review status as needs_review when any diff needs review", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration, [
        { processingStatus: "success", reviewStatus: "not_required" },
        { processingStatus: "success", reviewStatus: "needs_review" },
      ]);

      await finalizeBuild(mainBuild.id);

      expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
        processingStatus: "success",
        reviewStatus: "needs_review",
      });
    });

    test("marks the build review status as rejected when any diff is rejected, even if others need review", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration, [
        { processingStatus: "success", reviewStatus: "needs_review" },
        { processingStatus: "success", reviewStatus: "rejected" },
      ]);

      await finalizeBuild(mainBuild.id);

      expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
        reviewStatus: "rejected",
      });
    });

    test("marks the build review status as rejected ahead of needs_review when both are present", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration, [
        { processingStatus: "success", reviewStatus: "rejected" },
        { processingStatus: "success", reviewStatus: "needs_review" },
      ]);

      await finalizeBuild(mainBuild.id);

      expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
        reviewStatus: "rejected",
      });
    });

    test("marks the build review status as approved when any diff is approved and none need review or were rejected", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration, [
        { processingStatus: "success", reviewStatus: "not_required" },
        { processingStatus: "success", reviewStatus: "approved" },
      ]);

      await finalizeBuild(mainBuild.id);

      expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
        processingStatus: "success",
        reviewStatus: "approved",
      });
    });

    test("marks the build review status as not_required when there are no diffs", async ({
      mainBuild,
    }) => {
      await finalizeBuild(mainBuild.id);

      expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
        processingStatus: "success",
        reviewStatus: "not_required",
      });
    });
  });
});
