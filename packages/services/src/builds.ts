import { dbClient } from "@ovr/db/client";
import { v7 as uuidv7 } from "uuid";

import { enqueueExtract } from "./lib/queue";
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

export const getArtifactPath = (buildId: string): string => `builds/${buildId}/artifact.tar.gz`;

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
      status: "pending",
      captureMode: "worker",
      artifactPath: getArtifactPath(buildId),
      createdBy: callerId,
    });

    await enqueueExtract({
      buildId,
      artifactPath: getArtifactPath(buildId),
      targets: input.targets,
      viewports: input.viewports,
      diffThreshold: input.diffThreshold,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await dbClient.builds.updateStatus(buildId, "error", message);
    throw error;
  }

  return { status: "ok", data: buildId };
};

export const finalizeBuild = async (buildId: string): Promise<void> => {
  const diffs = await dbClient.diffs.findByBuild(buildId);

  if (diffs.some((diff) => diff.processingStatus === "error")) {
    await dbClient.builds.updateStatus(
      buildId,
      "error",
      "One or more snapshots failed to diff against their baseline",
    );
    return;
  }

  if (diffs.some((diff) => diff.reviewStatus === "rejected")) {
    await dbClient.builds.updateStatus(buildId, "rejected");
    return;
  }

  if (diffs.some((diff) => diff.reviewStatus === "needs_review")) {
    await dbClient.builds.updateStatus(buildId, "needs_review");
    return;
  }

  await dbClient.builds.updateStatus(buildId, "passed");
};
