import assert from "node:assert";

import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import { dbClient } from "@ovr/db/client";
import type { BuildProcessingStatus, DiffProcessingStatus, DiffReviewStatus } from "@ovr/db/schema";
import { QueueName, type ExtractJobPayload } from "@ovr/queue";
import { storage } from "@ovr/storage";

import {
  cancelBuild,
  checkRebuildable,
  confirmBuildUpload,
  createBuild,
  finalizeBuild,
  getArtifactPath,
  rebuildBuild,
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

    test("persists the extract defaults so extraction can be replayed later", async ({
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

      expect(await dbClient.buildExtractDefaults.findByBuild(buildId)).toMatchObject({
        buildId,
        targets,
        viewports: [captureConfiguration],
        diffThreshold: 0.05,
      });
    });

    test("stays successful when the client retries the same confirmation", async ({
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

      const input = {
        targets: [{ id: "story-a", title: "Story", name: "A" }],
        viewports: [captureConfiguration],
        diffThreshold: 0.05,
      };

      await confirmBuildUpload(buildId, input);
      const retried = await confirmBuildUpload(buildId, input);

      expect(retried).toEqual({ status: "ok", data: undefined });
      expect(await dbClient.builds.findById(buildId)).toMatchObject({
        processingStatus: "queued",
        errorMessage: null,
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

  describe("rebuildBuild", () => {
    const TARGETS = [{ id: "story-a", title: "Story", name: "A" }];
    const VIEWPORTS = [{ name: "desktop", browser: "chromium", viewportWidth: 1280 }];

    type SeedBuildOptions = {
      projectId: string;
      userId: string;
      branch?: string;
      processingStatus?: BuildProcessingStatus;
      withExtractDefaults?: boolean;
      withArtifact?: boolean;
    };

    const seedSettledBuild = async ({
      projectId,
      userId,
      branch = "main",
      processingStatus = "success",
      withExtractDefaults = true,
      withArtifact = true,
    }: SeedBuildOptions) => {
      const created = await createBuild(
        {
          projectId,
          branch,
          commitSha: "a".repeat(40),
          name: "Add empty state",
          author: "Jordan Lee",
        },
        userId,
      );
      assert(created.status === "ok");
      const buildId = created.data;

      if (withArtifact) {
        await storage.uploadFile(
          getArtifactPath(projectId, buildId),
          Buffer.from("artifact-bytes"),
          "application/gzip",
        );
      }

      if (withExtractDefaults) {
        await dbClient.buildExtractDefaults.create({
          buildId,
          targets: TARGETS,
          viewports: VIEWPORTS,
          diffThreshold: 0.05,
        });
      }

      await dbClient.builds.updateProcessingStatus(buildId, processingStatus);

      return buildId;
    };

    test.for(["queued", "processing"] as const)(
      "returns NOT_SETTLED for a build that is still %s",
      async (processingStatus, { project, user }) => {
        const buildId = await seedSettledBuild({
          projectId: project.id,
          userId: user.id,
          processingStatus,
        });

        const result = await rebuildBuild(buildId, user.id);

        expect(result).toEqual({ status: "error", error: "NOT_SETTLED" });
      },
    );

    test.for(["success", "error", "canceled"] as const)(
      "creates a queued build carrying the source's commit and authorship from a %s build",
      async (processingStatus, { project, user }) => {
        const buildId = await seedSettledBuild({
          projectId: project.id,
          userId: user.id,
          processingStatus,
        });

        const result = await rebuildBuild(buildId, user.id);

        assert(result.status === "ok");
        expect(result.data).not.toBe(buildId);
        expect(await dbClient.builds.findById(result.data)).toMatchObject({
          projectId: project.id,
          branch: "main",
          commitSha: "a".repeat(40),
          name: "Add empty state",
          author: "Jordan Lee",
          processingStatus: "queued",
          reviewStatus: "not_required",
          buildType: "storybook",
          artifactPath: getArtifactPath(project.id, result.data),
          createdBy: user.id,
        });
      },
    );

    test("copies the artifact so the rebuild survives the source being purged", async ({
      project,
      user,
    }) => {
      const buildId = await seedSettledBuild({ projectId: project.id, userId: user.id });

      const result = await rebuildBuild(buildId, user.id);
      assert(result.status === "ok");

      await storage.deletePrefix(`${project.id}/builds/${buildId}/`);

      expect(await storage.objectExists(getArtifactPath(project.id, result.data))).toBe(true);
    });

    test("copies the extract defaults so the rebuild can itself be rebuilt", async ({
      project,
      user,
    }) => {
      const buildId = await seedSettledBuild({ projectId: project.id, userId: user.id });

      const result = await rebuildBuild(buildId, user.id);
      assert(result.status === "ok");

      expect(await dbClient.buildExtractDefaults.findByBuild(result.data)).toMatchObject({
        targets: TARGETS,
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });
    });

    test("enqueues an extract job for the rebuild", async ({ project, user, connection }) => {
      const buildId = await seedSettledBuild({ projectId: project.id, userId: user.id });

      const result = await rebuildBuild(buildId, user.id);
      assert(result.status === "ok");

      const job = await findExtractJob(connection, result.data);
      expect(job?.data).toEqual({
        buildId: result.data,
        artifactPath: getArtifactPath(project.id, result.data),
        targets: TARGETS,
        viewports: VIEWPORTS,
        diffThreshold: 0.05,
      });
    });

    test("increments the project's total builds count", async ({ project, user }) => {
      const buildId = await seedSettledBuild({ projectId: project.id, userId: user.id });
      const before = (await dbClient.projects.findById(project.id))?.totalBuildsCount ?? 0;

      await rebuildBuild(buildId, user.id);

      const after = (await dbClient.projects.findById(project.id))?.totalBuildsCount ?? 0;
      expect(after).toBe(before + 1);
    });

    test("leaves the source build and its snapshots untouched", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      const buildId = await seedSettledBuild({ projectId: project.id, userId: user.id });
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId, ...captureConfiguration, targetId: "story-a", status: "success" }],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        processingStatus: "success",
        reviewStatus: "approved",
      });
      const sourceBefore = await dbClient.builds.findById(buildId);

      await rebuildBuild(buildId, user.id);

      expect(await dbClient.builds.findById(buildId)).toEqual(sourceBefore);
      expect(await dbClient.snapshots.findByBuild(buildId)).toHaveLength(1);
      expect(await dbClient.diffs.findById(diff!.id)).toMatchObject({
        processingStatus: "success",
        reviewStatus: "approved",
      });
      expect(await storage.objectExists(getArtifactPath(project.id, buildId))).toBe(true);
    });

    test("returns NOT_LATEST_ON_BRANCH when a newer build exists on the same branch", async ({
      project,
      user,
    }) => {
      const buildId = await seedSettledBuild({ projectId: project.id, userId: user.id });
      await seedSettledBuild({ projectId: project.id, userId: user.id });

      const result = await rebuildBuild(buildId, user.id);

      expect(result).toEqual({ status: "error", error: "NOT_LATEST_ON_BRANCH" });
    });

    test("rebuilds when the newer build is on a different branch", async ({ project, user }) => {
      const buildId = await seedSettledBuild({ projectId: project.id, userId: user.id });
      await seedSettledBuild({
        projectId: project.id,
        userId: user.id,
        branch: "feature/other",
      });

      const result = await rebuildBuild(buildId, user.id);

      expect(result.status).toBe("ok");
    });

    test("rebuilds when the newer build belongs to a different project", async ({
      organization,
      project,
      user,
    }) => {
      const buildId = await seedSettledBuild({ projectId: project.id, userId: user.id });
      const otherProject = await dbClient.projects.addProject({
        name: "Other Project",
        gitMainBranch: "main",
        organizationId: organization.id,
        creatorId: user.id,
      });
      await seedSettledBuild({ projectId: otherProject!.id, userId: user.id });

      const result = await rebuildBuild(buildId, user.id);

      expect(result.status).toBe("ok");
    });

    test("returns NOT_LATEST_ON_BRANCH for the source once its rebuild exists", async ({
      project,
      user,
    }) => {
      const buildId = await seedSettledBuild({ projectId: project.id, userId: user.id });

      const first = await rebuildBuild(buildId, user.id);
      assert(first.status === "ok");
      await dbClient.builds.updateProcessingStatus(first.data, "success");

      const second = await rebuildBuild(first.data, user.id);
      expect(second.status).toBe("ok");

      const source = await dbClient.builds.findById(buildId);
      expect(await checkRebuildable(source!)).toEqual({
        status: "error",
        error: "NOT_LATEST_ON_BRANCH",
      });
    });

    test("returns NO_EXTRACT_DEFAULTS for a build captured before they were stored", async ({
      project,
      user,
    }) => {
      const buildId = await seedSettledBuild({
        projectId: project.id,
        userId: user.id,
        withExtractDefaults: false,
      });

      const result = await rebuildBuild(buildId, user.id);

      expect(result).toEqual({ status: "error", error: "NO_EXTRACT_DEFAULTS" });
    });

    test("returns ARTIFACT_MISSING when retention has already purged the storybook", async ({
      project,
      user,
    }) => {
      const buildId = await seedSettledBuild({
        projectId: project.id,
        userId: user.id,
        withArtifact: false,
      });

      const before = (await dbClient.projects.findById(project.id))?.totalBuildsCount;

      const result = await rebuildBuild(buildId, user.id);

      expect(result).toEqual({ status: "error", error: "ARTIFACT_MISSING" });
      expect((await dbClient.projects.findById(project.id))?.totalBuildsCount).toBe(before);
    });

    test("returns BUILD_NOT_FOUND when the build does not exist", async ({ user }) => {
      const result = await rebuildBuild(crypto.randomUUID(), user.id);

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
        {
          processingStatus: "success",
          reviewStatus: "not_required",
          pixelDiffCount: 0,
          diffPercent: 0,
        },
        {
          processingStatus: "success",
          reviewStatus: "not_required",
          pixelDiffCount: 0,
          diffPercent: 0,
        },
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

    test("marks the build review status as auto_approved when a new snapshot with no prior baseline was auto-resolved", async ({
      mainBuild,
      captureConfiguration,
    }) => {
      await seedDiffs(mainBuild.id, captureConfiguration, [
        { processingStatus: "success", reviewStatus: "not_required" },
      ]);

      await finalizeBuild(mainBuild.id);

      expect(await dbClient.builds.findById(mainBuild.id)).toMatchObject({
        processingStatus: "success",
        reviewStatus: "auto_approved",
      });
    });
  });
});
