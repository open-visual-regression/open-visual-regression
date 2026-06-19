import { ORPCError } from "@orpc/client";
import { dbClient } from "@ovr/db/client";

export const getAuthorizedSnapshot = async (snapshotId: string, organizationId: string) => {
  const snapshot = await dbClient.snapshots.findById(snapshotId);

  if (!snapshot) {
    throw new ORPCError("NOT_FOUND");
  }

  const build = await dbClient.builds.findById(snapshot.buildId);

  if (!build) {
    throw new ORPCError("NOT_FOUND");
  }

  const project = await dbClient.projects.getProject({
    projectId: build.projectId,
    organizationId,
  });

  if (!project) {
    throw new ORPCError("NOT_FOUND");
  }

  return { snapshot, build, project };
};
