import { vi } from "vitest";

import { personalTokenMetadata } from "@ovr/db/repository/accessTokens";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

describe("accessTokens", () => {
  describe("create", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.accessTokens.create({ name: "my token" });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return a token for a reviewer without needing an admin", async ({
      reviewer: _,
    }) => {
      const [error, result] = await serverClient.accessTokens.create({ name: "cursor" });
      expect(error).toBeNull();
      expect(result?.token).toMatch(/^ovr_pat_/);
    });

    test("should return a token for a viewer", async ({ viewer: _ }) => {
      const [error, result] = await serverClient.accessTokens.create({ name: "claude" });
      expect(error).toBeNull();
      expect(result?.token).toMatch(/^ovr_pat_/);
    });

    test("should grant the created token permission to read builds", async ({ reviewer: _ }) => {
      const [, result] = await serverClient.accessTokens.create({ name: "cursor" });

      const verified = await auth.api.verifyApiKey({
        body: { key: result!.token, permissions: { builds: ["read"] } },
      });
      expect(verified.valid).toBe(true);
    });

    test("should withhold permission to write builds", async ({ reviewer: _ }) => {
      const [, result] = await serverClient.accessTokens.create({ name: "cursor" });

      const verified = await auth.api.verifyApiKey({
        body: { key: result!.token, permissions: { builds: ["write"] } },
      });
      expect(verified.valid).toBe(false);
    });

    test("should withhold permission to review", async ({ reviewer: _ }) => {
      const [, result] = await serverClient.accessTokens.create({ name: "cursor" });

      const verified = await auth.api.verifyApiKey({
        body: { key: result!.token, permissions: { reviews: ["write"] } },
      });
      expect(verified.valid).toBe(false);
    });
  });

  describe("list", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.accessTokens.list({});
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return an empty list when the user has no tokens", async ({ reviewer: _ }) => {
      const [error, result] = await serverClient.accessTokens.list({});
      expect(error).toBeNull();
      expect(result?.accessTokens).toHaveLength(0);
      expect(result?.total).toBe(0);
    });

    test("should return the tokens the user created", async ({ reviewer: _ }) => {
      await serverClient.accessTokens.create({ name: "cursor" });
      await serverClient.accessTokens.create({ name: "claude" });

      const [error, result] = await serverClient.accessTokens.list({});
      expect(error).toBeNull();
      expect(result?.total).toBe(2);
      expect(result?.accessTokens).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "cursor" }),
          expect.objectContaining({ name: "claude" }),
        ]),
      );
    });

    test("should not return another user's tokens", async ({ reviewer: _, admin }) => {
      await auth.api.createApiKey({
        body: {
          name: "the admin's token",
          prefix: "ovr_pat_",
          userId: admin.id,
          metadata: personalTokenMetadata(),
        },
      });
      await serverClient.accessTokens.create({ name: "the reviewer's token" });

      const [, result] = await serverClient.accessTokens.list({});
      expect(result?.total).toBe(1);
      expect(result?.accessTokens).toEqual([
        expect.objectContaining({ name: "the reviewer's token" }),
      ]);
    });

    test("should not return a project api key", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add({
        projectName: "Test Project",
        projectDescription: "A test project",
        gitMainBranch: "main",
      });
      await serverClient.apiKeys.create({ projectId: addResult!.projectId, name: "ci" });

      const [, result] = await serverClient.accessTokens.list({});
      expect(result?.accessTokens).toHaveLength(0);
      expect(result?.total).toBe(0);
    });

    test("should not return a key that is not marked as a personal token", async ({ reviewer }) => {
      await auth.api.createApiKey({
        body: { name: "some other key", userId: reviewer.id, metadata: { note: "not a token" } },
      });

      const [, result] = await serverClient.accessTokens.list({});
      expect(result?.accessTokens).toHaveLength(0);
      expect(result?.total).toBe(0);
    });

    test("should respect the limit and offset params", async ({ reviewer: _ }) => {
      await serverClient.accessTokens.create({ name: "one" });
      await serverClient.accessTokens.create({ name: "two" });
      await serverClient.accessTokens.create({ name: "three" });

      const [error, result] = await serverClient.accessTokens.list({ limit: 2, offset: 1 });
      expect(error).toBeNull();
      expect(result?.accessTokens).toHaveLength(2);
      expect(result?.total).toBe(3);
    });
  });

  describe("revoke", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.accessTokens.revoke({ tokenId: "fake-id" });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should delete the token when revoked by its owner", async ({ reviewer: _ }) => {
      await serverClient.accessTokens.create({ name: "cursor" });
      const [, beforeList] = await serverClient.accessTokens.list({});
      const [token] = beforeList!.accessTokens;

      const [error] = await serverClient.accessTokens.revoke({ tokenId: token!.id });
      expect(error).toBeNull();

      const [, afterList] = await serverClient.accessTokens.list({});
      expect(afterList?.accessTokens).toHaveLength(0);
    });

    test("should stop the revoked token from verifying", async ({ reviewer: _ }) => {
      const [, created] = await serverClient.accessTokens.create({ name: "cursor" });
      const [, beforeList] = await serverClient.accessTokens.list({});
      const [token] = beforeList!.accessTokens;

      await serverClient.accessTokens.revoke({ tokenId: token!.id });

      const verified = await auth.api.verifyApiKey({ body: { key: created!.token } });
      expect(verified.valid).toBe(false);
    });

    test("should return NOT_FOUND when revoking a token owned by another user", async ({
      admin,
      reviewer: _,
    }) => {
      const adminToken = await auth.api.createApiKey({
        body: { name: "admin token", prefix: "ovr_pat_", userId: admin.id },
      });

      const [error] = await serverClient.accessTokens.revoke({ tokenId: adminToken.id });
      expect(error?.code).toBe("NOT_FOUND");

      const stillValid = await auth.api.verifyApiKey({ body: { key: adminToken.key } });
      expect(stillValid.valid).toBe(true);
    });

    test("should return NOT_FOUND when revoking a project api key", async ({ admin: _ }) => {
      const [, addResult] = await serverClient.projects.add({
        projectName: "Test Project",
        projectDescription: "A test project",
        gitMainBranch: "main",
      });
      await serverClient.apiKeys.create({ projectId: addResult!.projectId, name: "ci" });
      const [, keys] = await serverClient.apiKeys.list({ projectId: addResult!.projectId });

      const [error] = await serverClient.accessTokens.revoke({ tokenId: keys!.apiKeys[0]!.id });
      expect(error?.code).toBe("NOT_FOUND");
    });
  });
});
