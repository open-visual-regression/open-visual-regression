import { vi } from "vitest";
import { headers } from "next/headers";

import { test, describe, expect } from "@/lib/testing/fixtures";
import { serverClient } from "@/lib/router";
import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { captureConfigurations } from "@ovr/db/schema";
import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";

vi.mock("next/headers");

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
  diffThreshold: 0.05,
};

const setApiKeyHeader = (key?: string) => {
  vi.mocked(headers).mockResolvedValue(new Headers(key ? { authorization: `Bearer ${key}` } : {}));
};

const createProjectWithApiKey = async () => {
  const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
  const projectId = addResult!.projectId;

  await db.insert(captureConfigurations).values({ projectId, name: "Default" });

  const [, keyResult] = await serverClient.apiKeys.create({ projectId, name: "ci" });

  return { projectId, apiKey: keyResult!.key };
};

describe("builds", () => {
  describe("createBuild", () => {
    test("should return UNAUTHORIZED when no api key is provided", async () => {
      setApiKeyHeader();

      const [error] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
        targets: ["story-a"],
      });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return UNAUTHORIZED for an invalid api key", async () => {
      setApiKeyHeader("ovr_api_key_invalid");

      const [error] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
        targets: ["story-a"],
      });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("creates a build under the project the key is scoped to and enqueues captures", async ({
      admin: _,
    }) => {
      const { projectId, apiKey } = await createProjectWithApiKey();

      setApiKeyHeader(apiKey);

      const [error, result] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
        targets: ["story-a", "story-b"],
      });

      expect(error).toBeNull();
      expect(result?.buildId).toBeTruthy();
      expect(result?.uploadUrl).toContain("http");

      const build = await dbClient.builds.findById(result!.buildId);
      expect(build).toMatchObject({
        projectId,
        branch: "main",
        commitSha: "a".repeat(40),
        status: "pending",
      });

      const snapshots = await dbClient.snapshots.findByBuild(result!.buildId);
      expect(snapshots.map((snapshot) => snapshot.targetId).sort()).toEqual(["story-a", "story-b"]);
    });
  });

  describe("getBuildStatus", () => {
    test("should return UNAUTHORIZED when no api key is provided", async () => {
      setApiKeyHeader();

      const [error] = await serverClient.builds.getBuildStatus({ buildId: crypto.randomUUID() });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("returns the build status for a build in the key's project", async ({ admin: _ }) => {
      const { apiKey } = await createProjectWithApiKey();
      setApiKeyHeader(apiKey);

      const [, createResult] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
        targets: ["story-a"],
      });

      const [error, result] = await serverClient.builds.getBuildStatus({
        buildId: createResult!.buildId,
      });

      expect(error).toBeNull();
      expect(result?.status).toBe("pending");
      expect(result?.reviewUrl).toBeUndefined();
    });

    test("returns a reviewUrl when the build needs review", async ({ admin: _ }) => {
      const { projectId, apiKey } = await createProjectWithApiKey();
      setApiKeyHeader(apiKey);

      const [, createResult] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
        targets: ["story-a"],
      });
      const buildId = createResult!.buildId;

      await dbClient.builds.updateStatus(buildId, "needs_review");

      const [error, result] = await serverClient.builds.getBuildStatus({ buildId });

      expect(error).toBeNull();
      expect(result?.status).toBe("needs_review");
      expect(result?.reviewUrl).toBe(
        `http://localhost:3000/projects/${projectId}/builds/${buildId}`,
      );
    });

    test("returns FORBIDDEN for a build belonging to a different project", async ({ admin: _ }) => {
      const projectA = await createProjectWithApiKey();
      const projectB = await createProjectWithApiKey();

      setApiKeyHeader(projectB.apiKey);
      const [, createResult] = await serverClient.builds.createBuild({
        branch: "main",
        commitSha: "a".repeat(40),
        targets: ["story-a"],
      });

      setApiKeyHeader(projectA.apiKey);
      const [error] = await serverClient.builds.getBuildStatus({ buildId: createResult!.buildId });

      expect(error?.code).toBe("FORBIDDEN");
    });
  });
});
