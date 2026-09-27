import { headers } from "next/headers";
import { vi } from "vitest";

import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";
import { dbClient } from "@ovr/db/client";

import { serverClient } from "@/lib/router";
import { describe, expect, test } from "@/lib/testing/fixtures";

import { GET } from "../route";

vi.mock("next/headers");

const NONEXISTENT_PROJECT_ID = "019edfc7-e040-7492-86b2-ccfdc00cf6e2";

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
};

const buildRequest = async (projectId: string) =>
  GET(
    new Request(`http://localhost/projects/${projectId}/baseline`, { headers: await headers() }),
    { params: Promise.resolve({ projectId }) },
  );

describe("GET /projects/[projectId]/baseline", () => {
  test("should redirect to login when there is no session", async () => {
    const response = await buildRequest(NONEXISTENT_PROJECT_ID);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/login");
  });

  test("should return 404 when the project does not exist", async ({ admin: _ }) => {
    const response = await buildRequest(NONEXISTENT_PROJECT_ID);

    expect(response.status).toBe(404);
  });

  test("should return 404 when the project has no baseline build", async ({ admin: _ }) => {
    const [, addResult] = await serverClient.projects.add(TEST_PROJECT);

    const response = await buildRequest(addResult!.projectId);

    expect(response.status).toBe(404);
  });

  test("should redirect to the baseline build", async ({ admin }) => {
    const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
    const projectId = addResult!.projectId;
    const build = await dbClient.builds.create({
      projectId,
      branch: TEST_PROJECT.gitMainBranch,
      commitSha: "a".repeat(40),
      processingStatus: "success",
      artifactPath: "builds/seed/artifact",
      createdBy: admin.id,
    });

    const response = await buildRequest(projectId);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`/projects/${projectId}/builds/${build!.id}`);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
