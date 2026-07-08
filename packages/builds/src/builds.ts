import { v7 as uuidv7 } from "uuid";

import { dbClient } from "@ovr/db/client";
import type { BuildReviewStatus, BuildType } from "@ovr/db/schema";
import { createLogger } from "@ovr/logger";
import { cancelBuildJobs, enqueueExtract, enqueuePublishStatus } from "@ovr/queue/producer";
import { storage } from "@ovr/storage";

import type { Result } from "./types";

const logger = createLogger("builds");

type Viewport = {
  name?: string;
  browser: string;
  viewportWidth: number;
  viewportHeight?: number;
  default?: boolean;
};

type CreateBuildInput = {
  projectId: string;
  branch: string;
  commitSha: string;
  name?: string;
  author?: string;
  buildType?: BuildType;
};

type ConfirmBuildUploadInput = {
  targets: { id: string; title: string; name: string }[];
  viewports: Viewport[];
  diffThreshold: number;
};

export const DEFAULT_DIFF_THRESHOLD = 0.05;

export const getArtifactPath = (projectId: string, buildId: string): string =>
  `${projectId}/builds/${buildId}/artifact.tar.gz`;

const publishStatus = async (buildId: string): Promise<void> => {
  try {
    await enqueuePublishStatus({ buildId });
  } catch (error) {
    logger.error({ err: error, buildId }, "failed to enqueue git status publish");
  }
};

export const createBuild = async (
  input: CreateBuildInput,
  callerId: string,
): Promise<Result<string, "PROJECT_NOT_FOUND">> => {
  const project = await dbClient.projects.findById(input.projectId);

  if (!project) {
    return { status: "error", error: "PROJECT_NOT_FOUND" };
  }

  const buildId = uuidv7();

  await dbClient.builds.create({
    id: buildId,
    projectId: input.projectId,
    branch: input.branch,
    commitSha: input.commitSha,
    name: input.name,
    author: input.author,
    processingStatus: "queued",
    captureMode: "worker",
    buildType: input.buildType ?? "storybook",
    artifactPath: getArtifactPath(input.projectId, buildId),
    createdBy: callerId,
  });

  await publishStatus(buildId);

  return { status: "ok", data: buildId };
};

export const confirmBuildUpload = async (
  buildId: string,
  input: ConfirmBuildUploadInput,
): Promise<Result<void, "BUILD_NOT_FOUND" | "ARTIFACT_MISSING">> => {
  const build = await dbClient.builds.findById(buildId);

  if (!build) {
    return { status: "error", error: "BUILD_NOT_FOUND" };
  }

  if (!(await storage.objectExists(build.artifactPath))) {
    return { status: "error", error: "ARTIFACT_MISSING" };
  }

  try {
    await enqueueExtract({
      buildId,
      artifactPath: build.artifactPath,
      targets: input.targets,
      viewports: input.viewports,
      diffThreshold: input.diffThreshold,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await dbClient.builds.updateProcessingStatus(buildId, "error", message);
    throw error;
  }

  return { status: "ok", data: undefined };
};

export const cancelBuild = async (
  buildId: string,
  canceledBy: string,
): Promise<Result<void, "BUILD_NOT_FOUND" | "NOT_CANCELABLE">> => {
  const result = await dbClient.transaction(async (tx) => {
    const canceledBuild = await dbClient.builds.cancelIfInProgress(buildId, canceledBy, tx);
    if (!canceledBuild) {
      return null;
    }

    await dbClient.snapshots.markUnfinishedAs(buildId, "canceled", tx);
    const diffIds = await dbClient.diffs.markPendingAs(buildId, "canceled", tx);
    return diffIds;
  });

  if (!result) {
    const build = await dbClient.builds.findById(buildId);
    return { status: "error", error: build ? "NOT_CANCELABLE" : "BUILD_NOT_FOUND" };
  }

  logger.info({ buildId, canceledBy }, "canceled build");

  try {
    await cancelBuildJobs(buildId, result);
  } catch (error) {
    logger.error({ err: error, buildId }, "failed to remove queued jobs for canceled build");
  }

  return { status: "ok", data: undefined };
};

type BuildDiff = Awaited<ReturnType<typeof dbClient.diffs.findByBuild>>[number];

const computeBuildReviewStatus = (diffs: BuildDiff[]): BuildReviewStatus => {
  if (diffs.some((diff) => diff.reviewStatus === "rejected")) {
    return "rejected";
  }

  if (diffs.some((diff) => diff.reviewStatus === "needs_review")) {
    return "needs_review";
  }

  if (diffs.some((diff) => diff.reviewStatus === "approved")) {
    return "approved";
  }

  if (diffs.some((diff) => (diff.pixelDiffCount ?? 0) > 0)) {
    return "auto_approved";
  }

  return "unchanged";
};

export const finalizeBuild = async (buildId: string): Promise<void> => {
  const build = await dbClient.builds.findById(buildId);
  if (build?.processingStatus === "canceled") {
    return;
  }

  const diffs = await dbClient.diffs.findByBuild(buildId);

  const hasProcessingError = diffs.some((diff) => diff.processingStatus === "error");
  const processingStatus = hasProcessingError ? "error" : "success";
  const reviewStatus = computeBuildReviewStatus(diffs);

  await dbClient.builds.updateResult(buildId, {
    processingStatus,
    reviewStatus,
    errorMessage: hasProcessingError
      ? "One or more snapshots failed to diff against their baseline"
      : null,
  });

  const changed =
    build?.processingStatus !== processingStatus || build?.reviewStatus !== reviewStatus;

  if (changed) {
    await publishStatus(buildId);
  }
};
