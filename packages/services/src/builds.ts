import { dbClient } from "@ovr/db/client";
import { v7 as uuidv7 } from "uuid";

import { enqueueCapture } from "./lib/queue";
import { uploadDirectory } from "./lib/storage";
import type { Result } from "./types";

type CreateBuildInput = {
  projectId: string;
  branch: string;
  commitSha: string;
  targets: string[];
  artifactDir: string;
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
    status: "pending",
    captureMode: "worker",
    artifactPath: `builds/${buildId}/artifact`,
    createdBy: callerId,
  });

  try {
    const captureConfigurations = await dbClient.captureConfigurations.findByProject(
      input.projectId,
    );

    const snapshots = await dbClient.snapshots.createMany(
      input.targets.flatMap((targetId) =>
        captureConfigurations.map((captureConfiguration) => ({
          buildId,
          captureConfigurationId: captureConfiguration.id,
          targetId,
          status: "pending" as const,
        })),
      ),
    );

    await uploadDirectory(input.artifactDir, `builds/${buildId}/artifact`);

    await Promise.all(
      snapshots.map((snapshot) => enqueueCapture({ buildId, snapshotId: snapshot.id })),
    );
  } catch (error) {
    await dbClient.builds.updateStatus(buildId, "error");
    throw error;
  }

  return { status: "ok", data: buildId };
};

export const finalizeBuild = async (buildId: string): Promise<void> => {
  const diffs = await dbClient.diffs.findByBuild(buildId);

  if (diffs.some((diff) => diff.status === "error")) {
    await dbClient.builds.updateStatus(buildId, "error");
    return;
  }

  if (diffs.some((diff) => diff.status === "needs_review")) {
    await dbClient.builds.updateStatus(buildId, "needs_review");
    return;
  }

  await dbClient.builds.updateStatus(buildId, "passed");
};
