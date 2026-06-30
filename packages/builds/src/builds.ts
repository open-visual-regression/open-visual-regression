import { dbClient } from "@ovr/db/client";
import type { BuildReviewStatus } from "@ovr/db/schema";
import { enqueueExtract } from "@ovr/queue/producer";
import { v7 as uuidv7 } from "uuid";

import type { Result } from "./types";

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
  targets: { id: string; title: string; name: string }[];
  viewports: Viewport[];
  diffThreshold: number;
};

export const DEFAULT_DIFF_THRESHOLD = 0.05;

export const getArtifactPath = (projectId: string, buildId: string): string =>
  `${projectId}/builds/${buildId}/artifact.tar.gz`;

export const createBuild = async (
  input: CreateBuildInput,
  callerId: string,
): Promise<Result<string, "PROJECT_NOT_FOUND">> => {
  const project = await dbClient.projects.findById(input.projectId);

  if (!project) {
    return { status: "error", error: "PROJECT_NOT_FOUND" };
  }

  const buildId = uuidv7();

  try {
    await dbClient.builds.create({
      id: buildId,
      projectId: input.projectId,
      branch: input.branch,
      commitSha: input.commitSha,
      name: input.name,
      author: input.author,
      processingStatus: "queued",
      captureMode: "worker",
      artifactPath: getArtifactPath(input.projectId, buildId),
      createdBy: callerId,
    });

    await enqueueExtract({
      buildId,
      artifactPath: getArtifactPath(input.projectId, buildId),
      targets: input.targets,
      viewports: input.viewports,
      diffThreshold: input.diffThreshold,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await dbClient.builds.updateProcessingStatus(buildId, "error", message);
    throw error;
  }

  return { status: "ok", data: buildId };
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

  return "not_required";
};

export const finalizeBuild = async (buildId: string): Promise<void> => {
  const diffs = await dbClient.diffs.findByBuild(buildId);

  const hasProcessingError = diffs.some((diff) => diff.processingStatus === "error");

  await dbClient.builds.updateResult(buildId, {
    processingStatus: hasProcessingError ? "error" : "success",
    reviewStatus: computeBuildReviewStatus(diffs),
    errorMessage: hasProcessingError
      ? "One or more snapshots failed to diff against their baseline"
      : null,
  });
};
