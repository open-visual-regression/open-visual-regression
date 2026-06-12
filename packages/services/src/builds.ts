import { dbClient } from "@ovr/db/client";
import { v7 as uuidv7 } from "uuid";

import { NotFoundError } from "./errors";
import { enqueueCapture } from "./lib/queue";
import { uploadDirectory } from "./lib/storage";

type CreateBuildInput = {
  projectId: string;
  branch: string;
  commitSha: string;
  stories: string[];
  storybookStaticDir: string;
};

export const createBuild = async (input: CreateBuildInput, callerId: string): Promise<string> => {
  const project = await dbClient.projects.findById(input.projectId);

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  const buildId = uuidv7();

  await dbClient.builds.create({
    id: buildId,
    projectId: input.projectId,
    branch: input.branch,
    commitSha: input.commitSha,
    status: "pending",
    captureMode: "worker",
    storybookPath: `builds/${buildId}/storybook`,
    createdBy: callerId,
  });

  const captureConfigurations = await dbClient.captureConfigurations.findByProject(input.projectId);

  const snapshots = await dbClient.snapshots.createMany(
    input.stories.flatMap((storyId) =>
      captureConfigurations.map((captureConfiguration) => ({
        buildId,
        captureConfigurationId: captureConfiguration.id,
        storyId,
        status: "pending" as const,
      })),
    ),
  );

  await uploadDirectory(input.storybookStaticDir, `builds/${buildId}/storybook`);

  await Promise.all(
    snapshots.map((snapshot) => enqueueCapture({ buildId, snapshotId: snapshot.id })),
  );

  return buildId;
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
