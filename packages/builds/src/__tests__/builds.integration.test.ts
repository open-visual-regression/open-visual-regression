import assert from "node:assert";

import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import { dbClient } from "@ovr/db/client";
import type { DiffProcessingStatus, DiffReviewStatus } from "@ovr/db/schema";
import { QueueName, type ExtractJobPayload } from "@ovr/queue";
import { storage } from "@ovr/storage";

import {
  cancelBuild,
  confirmBuildUpload,
  createBuild,
  finalizeBuild,
  getArtifactPath,
} from "../builds";
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

const findPublishStatusJob = async (connection: Redis, buildId: string) => {
  const queue = new Queue(QueueName.GIT_STATUS_PUBLISH, { connection });
  try {
    return await queue.getJob(buildId);
  } finally {
    await queue.close();
  }
};

type SeedDiffStatus = {
  processingStatus: DiffProcessingStatus;
  reviewStatus: DiffReviewStatus;
  pixelDiffCount?: number;
  diffPercent?: number;
};
type Viewport = {
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  viewportName: string;
};

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
    test("creates a queued build", async ({ project, user, connection }) => {
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

    test("increments the project's total builds count", async ({ project, user }) => {
      await createBuild(
        { projectId: project.id, branch: "main", commitSha: "a".repeat(40) },
        user.id,
      );
      await createBuild(
        { projectId: project.id, branch: "main", commitSha: "b".repeat(40) },
        user.id,
      );

      const updated = await dbClient.projects.findById(project.id);
      expect(updated?.totalBuildsCount).toBe(project.totalBuildsCount + 2);
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

    test("persists the extract input so it can be replayed later", async ({
      project,
      captureConfiguration,
      user,
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

      const targets = [{ id: "story-a", title: "Story", name: "A" }];

      await confirmBuildUpload(buildId, {
        targets,
        viewports: [captureConfiguration],
        diffThreshold: 0.05,
      });

      expect(await dbClient.buildExtractInputs.findByBuild(buildId)).toMatchObject({
        buildId,
        targets,
        viewports: [captureConfiguration],
        diffThreshold: 0.05,
      });
    });

    test("returns ARTIFACT_MISSING when the artifact was never uploaded", async ({
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

  describe("cancelBuild", () => {
    const seedSnapshot = async (
      buildId: string,
      viewport: Viewport,
      status: "queued" | "processing" | "success" | "error",
    ) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId, ...viewport, targetId: crypto.randomUUID(), status }],
      });
      return snapshot!;
    };

    test("cancels the build, its in-flight snapshots and pending diffs, and records who canceled it", async ({
      featureBuild,
      captureConfiguration,
      user,
    }) => {
      await dbClient.builds.updateProcessingStatus(featureBuild.id, "processing");

      const queuedSnapshot = await seedSnapshot(featureBuild.id, captureConfiguration, "queued");
      const processingSnapshot = await seedSnapshot(
        featureBuild.id,
        captureConfiguration,
        "processing",
      );
      const successSnapshot = await seedSnapshot(featureBuild.id, captureConfiguration, "success");
      const errorSnapshot = await seedSnapshot(featureBuild.id, captureConfiguration, "error");

      const pendingDiff = await dbClient.diffs.create({
        snapshotId: successSnapshot.id,
        processingStatus: "pending",
        reviewStatus: "not_required",
      });
      const doneDiff = await dbClient.diffs.create({
        snapshotId: errorSnapshot.id,
        processingStatus: "success",
        reviewStatus: "not_required",
      });

      const result = await cancelBuild(featureBuild.id, user.id);

      expect(result).toEqual({ status: "ok", data: undefined });

      expect(await dbClient.builds.findById(featureBuild.id)).toMatchObject({
        processingStatus: "canceled",
        canceledBy: user.id,
        errorMessage: null,
      });

      expect(await dbClient.snapshots.findById(queuedSnapshot.id)).toMatchObject({
        status: "canceled",
      });
      expect(await dbClient.snapshots.findById(processingSnapshot.id)).toMatchObject({
        status: "canceled",
      });
      expect(await dbClient.snapshots.findById(successSnapshot.id)).toMatchObject({
        status: "success",
      });
      expect(await dbClient.snapshots.findById(errorSnapshot.id)).toMatchObject({
        status: "error",
      });

      expect(await dbClient.diffs.findById(pendingDiff!.id)).toMatchObject({
        processingStatus: "canceled",
      });
      expect(await dbClient.diffs.findById(doneDiff!.id)).toMatchObject({
        processingStatus: "success",
      });
    });

    test("enqueues a status publish so the commit check reflects the cancellation", async ({
      featureBuild,
      user,
      connection,
    }) => {
      await dbClient.builds.updateProcessingStatus(featureBuild.id, "processing");

      await cancelBuild(featureBuild.id, user.id);

      expect(await findPublishStatusJob(connection, featureBuild.id)).toBeDefined();
    });

    test("returns NOT_CANCELABLE when the build has already finished", async ({
      featureBuild,
      user,
    }) => {
      await dbClient.builds.updateResult(featureBuild.id, {
        processingStatus: "success",
        reviewStatus: "unchanged",
      });

      const result = await cancelBuild(featureBuild.id, user.id);

      expect(result).toEqual({ status: "error", error: "NOT_CANCELABLE" });
      expect(await dbClient.builds.findById(featureBuild.id)).toMatchObject({
        processingStatus: "success",
        canceledBy: null,
      });
    });

    test("returns BUILD_NOT_FOUND when the build does not exist", async ({ user }) => {
      const result = await cancelBuild(crypto.randomUUID(), user.id);

      expect(result).toEqual({ status: "error", error: "BUILD_NOT_FOUND" });
    });
  });

  describe("finalizeBuild", () => {
    test("leaves a canceled build canceled even when a late diff finishes", async ({
      featureBuild,
      captureConfiguration,
      user,
    }) => {
      await dbClient.builds.updateProcessingStatus(featureBuild.id, "processing");
      await cancelBuild(featureBuild.id, user.id);

      await seedDiffs(featureBuild.id, captureConfiguration, [
        { processingStatus: "success", reviewStatus: "not_required" },
      ]);

      await finalizeBuild(featureBuild.id);

      expect(await dbClient.builds.findById(featureBuild.id)).toMatchObject({
        processingStatus: "canceled",
      });
    });

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

    test("marks the build review status as unchanged when there are no diffs", async ({
      mainBuild,
    }) => {
      await finalizeBuild(mainBuild.id);

      expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
        processingStatus: "success",
        reviewStatus: "unchanged",
      });
    });

    test("marks the build review status as unchanged when every auto-resolved diff had no pixel changes", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration, [
        { processingStatus: "success", reviewStatus: "not_required", pixelDiffCount: 0 },
        { processingStatus: "success", reviewStatus: "not_required", pixelDiffCount: 0 },
      ]);

      await finalizeBuild(mainBuild.id);

      expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
        processingStatus: "success",
        reviewStatus: "unchanged",
      });
    });

    test("marks the build review status as unchanged when an auto-resolved diff changed within the threshold", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration, [
        {
          processingStatus: "success",
          reviewStatus: "not_required",
          pixelDiffCount: 0,
          diffPercent: 0,
        },
        {
          processingStatus: "success",
          reviewStatus: "not_required",
          pixelDiffCount: 320,
          diffPercent: 0.01,
        },
      ]);

      await finalizeBuild(mainBuild.id);

      expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
        processingStatus: "success",
        reviewStatus: "unchanged",
      });
    });

    test("marks the build review status as auto_approved when an auto-resolved diff exceeded the threshold", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration, [
        {
          processingStatus: "success",
          reviewStatus: "not_required",
          pixelDiffCount: 0,
          diffPercent: 0,
        },
        {
          processingStatus: "success",
          reviewStatus: "not_required",
          pixelDiffCount: 320,
          diffPercent: 5,
        },
      ]);

      await finalizeBuild(mainBuild.id);

      expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
        processingStatus: "success",
        reviewStatus: "auto_approved",
      });
    });
  });
});
