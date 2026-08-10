import { v7 as uuidv7 } from "uuid";

import { dbClient } from "@ovr/db/client";
import type { BuildProcessingStatus, BuildReviewStatus, BuildType } from "@ovr/db/schema";
import { createLogger } from "@ovr/logger";
import type { CanceledBuildJobs } from "@ovr/queue";
import {
  cancelBuildJobs,
  enqueueExtract,
  enqueuePublishStatus,
  publishBuildStatusEvent,
} from "@ovr/queue/producer";
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

// One publish job per build (keyed by build id). The worker re-reads the build when it runs,
// so updates that land close together collapse into a single publish of the latest state.
export const publishStatus = async (buildId: string): Promise<void> => {
  try {
    await enqueuePublishStatus({ buildId });
  } catch (error) {
    logger.error({ err: error, buildId }, "failed to enqueue git status publish");
  }

  try {
    const build = await dbClient.builds.findById(buildId);
    if (build) {
      await publishBuildStatusEvent({
        buildId,
        processingStatus: build.processingStatus,
        reviewStatus: build.reviewStatus,
        errorMessage: build.errorMessage,
      });
    }
  } catch (error) {
    logger.error({ err: error, buildId }, "failed to publish build status event");
  }
};

const cancelInProgressBuild = async (
  buildId: string,
  canceledBy: string | null,
): Promise<string[] | null> =>
  dbClient.transaction(async (tx) => {
    const canceledBuild = await dbClient.builds.cancelIfInProgress(buildId, canceledBy, tx);
    if (!canceledBuild) {
      return null;
    }

    await dbClient.snapshots.markUnfinishedAs(buildId, "canceled", tx);
    return dbClient.diffs.markPendingAs(buildId, "canceled", tx);
  });

type SupersedingBuild = {
  id: string;
  projectId: string;
  branch: string;
  createdAt: string;
};

export const supersedeInFlightBuilds = async (build: SupersedingBuild): Promise<string[]> => {
  if (!build.branch.trim()) {
    return [];
  }

  const stale = await dbClient.builds.findMany({
    projectIds: [build.projectId],
    branches: [build.branch],
    processingStatuses: ["queued", "processing"],
    createdBefore: { createdAt: build.createdAt, id: build.id },
  });

  const canceled: CanceledBuildJobs[] = [];

  for (const staleBuild of stale) {
    const diffIds = await cancelInProgressBuild(staleBuild.id, null);
    if (diffIds) {
      canceled.push({ buildId: staleBuild.id, diffIds });
    }
  }

  if (canceled.length === 0) {
    return [];
  }

  const supersededBuildIds = canceled.map(({ buildId }) => buildId);
  logger.info(
    { buildId: build.id, branch: build.branch, supersededBuildIds },
    "superseded in-flight builds on the branch",
  );

  try {
    await cancelBuildJobs(canceled);
  } catch (error) {
    logger.error(
      { err: error, buildId: build.id },
      "failed to remove queued jobs for superseded builds",
    );
  }

  await Promise.all(supersededBuildIds.map((buildId) => publishStatus(buildId)));

  return supersededBuildIds;
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

  const build = await dbClient.transaction(async (tx) => {
    const created = await dbClient.builds.create({
      tx,
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
    await dbClient.projects.incrementTotalBuildsCount(input.projectId, tx);
    return created;
  });

  if (build) {
    await supersedeInFlightBuilds(build);
  }

  await publishStatus(buildId);

  return { status: "ok", data: buildId };
};

export const confirmBuildUpload = async (
  buildId: string,
  input: ConfirmBuildUploadInput,
): Promise<Result<void, "BUILD_NOT_FOUND" | "BUILD_CANCELED" | "ARTIFACT_MISSING">> => {
  const build = await dbClient.builds.findById(buildId);

  if (!build) {
    return { status: "error", error: "BUILD_NOT_FOUND" };
  }

  if (build.processingStatus === "canceled") {
    return { status: "error", error: "BUILD_CANCELED" };
  }

  if (!(await storage.objectExists(build.artifactPath))) {
    return { status: "error", error: "ARTIFACT_MISSING" };
  }

  try {
    await dbClient.buildExtractDefaults.create({
      buildId,
      targets: input.targets,
      viewports: input.viewports,
      diffThreshold: input.diffThreshold,
    });
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

export type RebuildBlockedReason = "NOT_SETTLED" | "NOT_LATEST_ON_BRANCH" | "NO_EXTRACT_DEFAULTS";

type RebuildCandidate = {
  id: string;
  projectId: string;
  branch: string;
  createdAt: string;
  processingStatus: BuildProcessingStatus;
};

type ExtractDefaults = NonNullable<
  Awaited<ReturnType<typeof dbClient.buildExtractDefaults.findByBuild>>
>;

export const checkRebuildable = async (
  build: RebuildCandidate,
): Promise<Result<ExtractDefaults, RebuildBlockedReason>> => {
  if (build.processingStatus === "queued" || build.processingStatus === "processing") {
    return { status: "error", error: "NOT_SETTLED" };
  }

  const [newerOnBranch, extractDefaults] = await Promise.all([
    dbClient.builds.findMany(
      {
        projectIds: [build.projectId],
        branches: [build.branch],
        createdAfter: { createdAt: build.createdAt, id: build.id },
      },
      { limit: 1 },
    ),
    dbClient.buildExtractDefaults.findByBuild(build.id),
  ]);

  if (newerOnBranch.length > 0) {
    return { status: "error", error: "NOT_LATEST_ON_BRANCH" };
  }

  if (!extractDefaults) {
    return { status: "error", error: "NO_EXTRACT_DEFAULTS" };
  }

  return { status: "ok", data: extractDefaults };
};

export const rebuildBuild = async (
  buildId: string,
  requestedBy: string,
): Promise<Result<string, "BUILD_NOT_FOUND" | "ARTIFACT_MISSING" | RebuildBlockedReason>> => {
  const source = await dbClient.builds.findById(buildId);

  if (!source) {
    return { status: "error", error: "BUILD_NOT_FOUND" };
  }

  const rebuildable = await checkRebuildable(source);

  if (rebuildable.status === "error") {
    return rebuildable;
  }

  const extractDefaults = rebuildable.data;

  if (!(await storage.objectExists(source.artifactPath))) {
    return { status: "error", error: "ARTIFACT_MISSING" };
  }

  const rebuildId = uuidv7();
  const artifactPath = getArtifactPath(source.projectId, rebuildId);

  await dbClient.transaction(async (tx) => {
    await dbClient.builds.create({
      tx,
      id: rebuildId,
      projectId: source.projectId,
      branch: source.branch,
      commitSha: source.commitSha,
      name: source.name,
      author: source.author,
      processingStatus: "queued",
      captureMode: source.captureMode,
      buildType: source.buildType,
      artifactPath,
      createdBy: requestedBy,
    });
    await dbClient.buildExtractDefaults.create({
      tx,
      buildId: rebuildId,
      targets: extractDefaults.targets,
      viewports: extractDefaults.viewports,
      diffThreshold: extractDefaults.diffThreshold,
    });
    await dbClient.projects.incrementTotalBuildsCount(source.projectId, tx);
  });

  try {
    await storage.copyObject(source.artifactPath, artifactPath);
    await enqueueExtract({
      buildId: rebuildId,
      artifactPath,
      targets: extractDefaults.targets,
      viewports: extractDefaults.viewports,
      diffThreshold: extractDefaults.diffThreshold,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await dbClient.builds.updateProcessingStatus(rebuildId, "error", message);
    await publishStatus(rebuildId);
    throw error;
  }

  logger.info({ buildId: rebuildId, sourceBuildId: source.id, requestedBy }, "rebuilt build");

  await publishStatus(rebuildId);

  return { status: "ok", data: rebuildId };
};

export const cancelBuild = async (
  buildId: string,
  canceledBy: string,
): Promise<Result<void, "BUILD_NOT_FOUND" | "NOT_CANCELABLE">> => {
  const diffIds = await cancelInProgressBuild(buildId, canceledBy);

  if (!diffIds) {
    const build = await dbClient.builds.findById(buildId);
    return { status: "error", error: build ? "NOT_CANCELABLE" : "BUILD_NOT_FOUND" };
  }

  logger.info({ buildId, canceledBy }, "canceled build");

  try {
    await cancelBuildJobs([{ buildId, diffIds }]);
  } catch (error) {
    logger.error({ err: error, buildId }, "failed to remove queued jobs for canceled build");
  }

  await publishStatus(buildId);

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

  if (diffs.some((diff) => diff.reviewStatus === "auto_approved")) {
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

export const updateBuildReviewStatus = async (buildId: string): Promise<void> => {
  const build = await dbClient.builds.findById(buildId);
  if (!build || build.processingStatus === "canceled") {
    return;
  }

  const diffs = await dbClient.diffs.findByBuild(buildId);
  const reviewStatus = computeBuildReviewStatus(diffs);

  if (reviewStatus === build.reviewStatus) {
    return;
  }

  await dbClient.builds.updateResult(buildId, {
    processingStatus: build.processingStatus,
    reviewStatus,
    errorMessage: build.errorMessage,
  });

  await publishStatus(buildId);
};
