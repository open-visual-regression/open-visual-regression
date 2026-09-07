import { vi } from "vitest";

import type { AddProjectInputSchema } from "@ovr/api/contracts/projects";
import { db, sql } from "@ovr/db/db";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

const FAKE_PROJECT_ID = "01900000-0000-7000-8000-000000000000";

const TEST_PROJECT: AddProjectInputSchema = {
  projectName: "Test Project",
  projectDescription: "A test project",
  gitMainBranch: "main",
};

describe("apiKeys", () => {
  describe("create", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.apiKeys.create({
        projectId: FAKE_PROJECT_ID,
        name: "my key",
      });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.apiKeys.create({
        projectId: FAKE_PROJECT_ID,
        name: "my key",
      });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return BAD_REQUEST when the project does not exist", async ({ admin: _ }) => {
      const [error] = await serverClient.apiKeys.create({
        projectId: FAKE_PROJECT_ID,
        name: "my key",
      });
      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should return the api key when created by an admin", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error, result] = await serverClient.apiKeys.create({ projectId, name: "my key" });
      expect(error).toBeNull();
      expect(result?.key).toMatch(/^ovr_api_key_/);
    });

    test("should grant the created key permission to write builds", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [, result] = await serverClient.apiKeys.create({ projectId, name: "my key" });

      const verified = await auth.api.verifyApiKey({
        body: { key: result!.key, permissions: { builds: ["write"] } },
      });
      expect(verified.valid).toBe(true);
    });

    test("should withhold permissions the created key was not granted", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [, result] = await serverClient.apiKeys.create({ projectId, name: "my key" });

      const verified = await auth.api.verifyApiKey({
        body: { key: result!.key, permissions: { reviews: ["write"] } },
      });
      expect(verified.valid).toBe(false);
    });

    test("should grant an agent read key permission to read builds but not write them", async ({
      admin: _,
    }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [, result] = await serverClient.apiKeys.create({
        projectId,
        name: "my key",
        preset: "agent_read",
      });

      const read = await auth.api.verifyApiKey({
        body: { key: result!.key, permissions: { builds: ["read"] } },
      });
      expect(read.valid).toBe(true);

      const write = await auth.api.verifyApiKey({
        body: { key: result!.key, permissions: { builds: ["write"] } },
      });
      expect(write.valid).toBe(false);
    });

    test("should grant an agent review key permission to write reviews", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [, result] = await serverClient.apiKeys.create({
        projectId,
        name: "my key",
        preset: "agent_review",
      });

      const verified = await auth.api.verifyApiKey({
        body: { key: result!.key, permissions: { builds: ["read"], reviews: ["write"] } },
      });
      expect(verified.valid).toBe(true);
    });
  });

  describe("list", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.apiKeys.list({ projectId: FAKE_PROJECT_ID });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.apiKeys.list({ projectId: FAKE_PROJECT_ID });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return BAD_REQUEST when the project does not exist", async ({ admin: _ }) => {
      const [error] = await serverClient.apiKeys.list({ projectId: FAKE_PROJECT_ID });
      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should return an empty list when the project has no keys", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      const [error, result] = await serverClient.apiKeys.list({ projectId });
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(0);
      expect(result?.total).toBe(0);
    });

    test("should return the api keys for the project", async ({ admin }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.apiKeys.create({ projectId, name: "key one" });
      await serverClient.apiKeys.create({ projectId, name: "key two" });

      const [error, result] = await serverClient.apiKeys.list({ projectId });
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(2);
      expect(result?.total).toBe(2);
      expect(result?.apiKeys[0]).toMatchObject({ ownerName: admin.name });
    });

    test("should return the preset each key was created with", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.apiKeys.create({ projectId, name: "ci" });
      await serverClient.apiKeys.create({ projectId, name: "agent", preset: "agent_review" });

      const [, result] = await serverClient.apiKeys.list({ projectId });
      expect(result?.apiKeys).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "ci", preset: "ci_upload" }),
          expect.objectContaining({ name: "agent", preset: "agent_review" }),
        ]),
      );
    });

    test("should return the other keys as custom when one key's permissions are malformed", async ({
      admin: _,
    }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.apiKeys.create({ projectId, name: "ci" });
      await serverClient.apiKeys.create({ projectId, name: "corrupted" });
      await db.execute(sql`UPDATE apikey SET permissions = 'not json' WHERE name = 'corrupted'`);

      const [error, result] = await serverClient.apiKeys.list({ projectId });
      expect(error).toBeNull();
      expect(result?.apiKeys).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "ci", preset: "ci_upload" }),
          expect.objectContaining({ name: "corrupted", preset: null }),
        ]),
      );
    });

    test("should respect the limit and offset params", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.apiKeys.create({ projectId, name: "key one" });
      await serverClient.apiKeys.create({ projectId, name: "key two" });
      await serverClient.apiKeys.create({ projectId, name: "key three" });

      const [error, result] = await serverClient.apiKeys.list({ projectId, limit: 2, offset: 1 });
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(2);
      expect(result?.total).toBe(3);
    });

    test("should only return keys belonging to the given project", async ({ admin: _ }) => {
      const [, projectA] = await serverClient.projects.add(TEST_PROJECT);
      const [, projectB] = await serverClient.projects.add({
        ...TEST_PROJECT,
        projectName: "Project B",
      });

      await serverClient.apiKeys.create({ projectId: projectA!.projectId, name: "key for A" });
      await serverClient.apiKeys.create({ projectId: projectB!.projectId, name: "key for B" });

      const [error, result] = await serverClient.apiKeys.list({ projectId: projectA!.projectId });
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(1);
      expect(result?.apiKeys[0]).toMatchObject({ name: "key for A" });
    });
  });

  describe("revoke", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.apiKeys.revoke({ keyId: "fake-id" });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.apiKeys.revoke({ keyId: "fake-id" });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should delete the api key from the database when revoked by an admin", async ({
      admin: _,
    }) => {
      const [, addResult] = await serverClient.projects.add(TEST_PROJECT);
      const projectId = addResult!.projectId;

      await serverClient.apiKeys.create({ projectId, name: "revoke test key" });
      const [, beforeList] = await serverClient.apiKeys.list({ projectId });
      expect(beforeList?.apiKeys).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "revoke test key" })]),
      );

      const [key] = beforeList!.apiKeys;
      const [error] = await serverClient.apiKeys.revoke({ keyId: key!.id });
      expect(error).toBeNull();

      const [, afterList] = await serverClient.apiKeys.list({ projectId });
      expect(afterList?.apiKeys).toHaveLength(0);
    });
  });
});
