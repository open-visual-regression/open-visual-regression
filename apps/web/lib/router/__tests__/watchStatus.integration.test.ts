import { v7 as uuidv7 } from "uuid";
import { vi } from "vitest";

import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";
import { cancelBuild } from "@ovr/builds/builds";
import { dbClient } from "@ovr/db/client";

import { serverClient } from "@/lib/router";
import { describe, expect, test } from "@/lib/testing/fixtures";

vi.mock("next/headers");

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
};

const createQueuedBuild = async (createdBy: string) => {
  const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
  const projectId = addResult!.projectId;

  const buildId = uuidv7();
  await dbClient.builds.create({
    id: buildId,
    projectId,
    branch: "main",
    commitSha: "a".repeat(40),
    processingStatus: "queued",
    artifactPath: `${projectId}/builds/${buildId}/artifact.tar.gz`,
    createdBy,
  });

  return { projectId, buildId };
};

describe("builds.watchStatus", () => {
  test("returns UNAUTHORIZED without a session", async () => {
    const [error] = await serverClient.builds.watchStatus({ buildId: uuidv7() });

    expect(error?.code).toBe("UNAUTHORIZED");
  });

  test("returns NOT_FOUND for a build outside the caller's organization", async ({ admin: _ }) => {
    const [error] = await serverClient.builds.watchStatus({ buildId: uuidv7() });

    expect(error?.code).toBe("NOT_FOUND");
  });

  test("streams the current status then closes once the build settles", async ({ admin }) => {
    const { buildId } = await createQueuedBuild(admin.id);

    const [error, stream] = await serverClient.builds.watchStatus({ buildId });
    expect(error).toBeNull();

    const first = await stream!.next();
    expect(first.done).toBe(false);
    expect(first.value).toEqual({ status: "queued" });

    await cancelBuild(buildId, admin.id);

    const second = await stream!.next();
    expect(second.value).toEqual({ status: "canceled" });

    const third = await stream!.next();
    expect(third.done).toBe(true);
  });
});
