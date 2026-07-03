import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { headers } from "next/headers";
import * as tar from "tar";
import { vi } from "vitest";

import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";
import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { organization, projects } from "@ovr/db/schema";
import { storage } from "@ovr/storage";

import { serverClient } from "@/lib/router";
import { describe, expect, test } from "@/lib/testing/fixtures";

import { GET } from "../route";

vi.mock("next/headers");

const NONEXISTENT_BUILD_ID = "019edfc7-e040-7492-86b2-ccfdc00cf6e2";

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
};

const buildRequest = async (buildId: string, filePath: string) =>
  GET(
    new Request(`http://localhost/api/storybook/${buildId}/${filePath}`, {
      headers: await headers(),
    }),
  );

const uploadArtifact = async (artifactPath: string, files: Record<string, string>) => {
  const dir = await mkdtemp(path.join(tmpdir(), "ovr-artifact-"));
  try {
    for (const [relativePath, contents] of Object.entries(files)) {
      const fullPath = path.join(dir, relativePath);
      await writeFile(fullPath, contents);
    }
    const tarballPath = path.join(dir, "artifact.tar.gz");
    await tar.c({ gzip: true, file: tarballPath, cwd: dir }, Object.keys(files));
    await storage.uploadFile(artifactPath, await readFile(tarballPath), "application/gzip");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

const createStorybookBuild = async (projectId: string, createdBy: string) => {
  const build = await dbClient.builds.create({
    projectId,
    branch: "main",
    commitSha: "a".repeat(40),
    artifactPath: `test/${crypto.randomUUID()}.tar.gz`,
    createdBy,
  });

  return build!;
};

describe("GET /api/storybook/[...path]", () => {
  test("should return 401 when there is no session", async () => {
    const response = await buildRequest(NONEXISTENT_BUILD_ID, "index.html");

    expect(response.status).toBe(401);
  });

  test("should return 404 when the build does not exist", async ({ admin: _ }) => {
    const response = await buildRequest(NONEXISTENT_BUILD_ID, "index.html");

    expect(response.status).toBe(404);
  });

  test("should return 404 for a build in a different organization", async ({ admin }) => {
    const [otherOrg] = await db
      .insert(organization)
      .values({
        id: crypto.randomUUID(),
        name: "Other Org",
        slug: crypto.randomUUID(),
        createdAt: new Date(),
      })
      .returning();

    const [otherProject] = await db
      .insert(projects)
      .values({
        name: "Other Org Project",
        gitMainBranch: "main",
        organizationId: otherOrg!.id,
        creatorId: admin.id,
      })
      .returning();

    const build = await createStorybookBuild(otherProject!.id, admin.id);
    await uploadArtifact(build.artifactPath, { "index.html": "<html>secret</html>" });

    const response = await buildRequest(build.id, "index.html");

    expect(response.status).toBe(404);
  });

  test("should return 404 when the requested file is not in the bundle", async ({ admin }) => {
    const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
    const build = await createStorybookBuild(addResult!.projectId, admin.id);
    await uploadArtifact(build.artifactPath, { "index.html": "<html>hi</html>" });

    const response = await buildRequest(build.id, "does-not-exist.html");

    expect(response.status).toBe(404);
  });

  test("should stream index.html with the correct content type", async ({ admin }) => {
    const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
    const build = await createStorybookBuild(addResult!.projectId, admin.id);
    const html = "<html><body>storybook</body></html>";
    await uploadArtifact(build.artifactPath, { "index.html": html });

    const response = await buildRequest(build.id, "index.html");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html");
    expect(response.headers.get("cache-control")).toContain("immutable");
    expect(await response.text()).toBe(html);
  });

  test("should stream a nested asset with its own content type", async ({ admin }) => {
    const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
    const build = await createStorybookBuild(addResult!.projectId, admin.id);
    const js = "console.log('hi')";
    await uploadArtifact(build.artifactPath, {
      "index.html": "<html></html>",
      "runtime.js": js,
    });

    const response = await buildRequest(build.id, "runtime.js");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/javascript");
    expect(await response.text()).toBe(js);
  });

  test("should not escape the bundle via encoded traversal segments", async ({ admin }) => {
    const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
    const build = await createStorybookBuild(addResult!.projectId, admin.id);
    await uploadArtifact(build.artifactPath, { "index.html": "<html></html>" });

    const response = await buildRequest(build.id, "%2e%2e/%2e%2e/etc/passwd");

    expect(response.status).not.toBe(200);
  });

  test("should not escape the bundle when the path normalizes to a bare parent", async ({
    admin,
  }) => {
    const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
    const build = await createStorybookBuild(addResult!.projectId, admin.id);
    await uploadArtifact(build.artifactPath, { "index.html": "<html></html>" });

    const response = await buildRequest(build.id, "foo/%2e%2e/%2e%2e");

    expect(response.status).not.toBe(200);
  });
});
