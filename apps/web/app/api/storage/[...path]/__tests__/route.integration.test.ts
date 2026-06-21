import { headers } from "next/headers";
import { vi } from "vitest";

import { describe, expect, test } from "@/lib/testing/fixtures";
import { serverClient } from "@/lib/router";
import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";
import { GET } from "../route";

vi.mock("next/headers");

const NONEXISTENT_PROJECT_ID = "01900000-0000-7000-8000-000000000000";

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
};

const buildRequest = async (path: string[]) =>
  GET(new Request(`http://localhost/api/storage/${path.join("/")}`, { headers: await headers() }));

describe("GET /api/storage/[...path]", () => {
  test("should return 401 when there is no session", async () => {
    const response = await buildRequest([NONEXISTENT_PROJECT_ID, "snapshots", "foo.png"]);

    expect(response.status).toBe(401);
  });

  test("should return 403 when the project does not exist", async ({ admin: _ }) => {
    const response = await buildRequest([NONEXISTENT_PROJECT_ID, "snapshots", "foo.png"]);

    expect(response.status).toBe(403);
  });

  test("should redirect to a presigned url for an authorized request", async ({ admin: _ }) => {
    const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
    const projectId = addResult!.projectId;

    const response = await buildRequest([projectId, "snapshots", "foo.png"]);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain(`${projectId}/snapshots/foo.png`);
  });
});
