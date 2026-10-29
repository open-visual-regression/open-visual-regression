import { vi } from "vitest";

import { serverClient } from "@/lib/router";
import { useFakeGithub } from "@/lib/testing/fakeGithub";
import { describe, expect, test } from "@/lib/testing/fixtures";

vi.mock("next/headers");

const github = useFakeGithub();

describe("gitProviders", () => {
  describe("list", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.gitProviders.list();
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.gitProviders.list();
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should only offer access tokens when no connection is configured", async ({
      admin: _,
    }) => {
      github.unconfigure();

      const [error, result] = await serverClient.gitProviders.list();

      expect(error).toBeNull();
      expect(result?.providers).toEqual([
        {
          id: "github",
          name: "github",
          repository: { placeholder: "owner/repo" },
          credentialTypes: ["access_token"],
          connections: {
            label: "github app",
            setupGuideUrl: "https://docs.openvisualregression.com/self-hosting/github-app",
            configured: false,
          },
        },
      ]);
    });

    test("should offer connections first once they are configured", async ({ admin: _ }) => {
      github.configure();

      const [, result] = await serverClient.gitProviders.list();

      expect(result?.providers[0]).toMatchObject({
        credentialTypes: ["connection", "access_token"],
        connections: { configured: true },
      });
    });
  });

  describe("connections", () => {
    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.gitProviders.connections();
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should report each provider's connections", async ({ admin: _ }) => {
      github.configure();

      const [error, result] = await serverClient.gitProviders.connections();

      expect(error).toBeNull();
      expect(result?.providers).toEqual([
        expect.objectContaining({
          provider: "github",
          label: "github app",
          status: expect.objectContaining({
            status: "ok",
            connections: [expect.objectContaining({ id: "42", name: "acme", repositoryCount: 2 })],
          }),
        }),
      ]);
    });

    test("should report a provider that isn't configured", async ({ admin: _ }) => {
      github.unconfigure();

      const [, result] = await serverClient.gitProviders.connections();

      expect(result?.providers[0]?.status).toEqual({ status: "not_configured" });
    });
  });

  describe("searchRepositories", () => {
    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.gitProviders.searchRepositories({ provider: "github" });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should search the provider's repositories", async ({ admin: _ }) => {
      github.configure();

      const [error, result] = await serverClient.gitProviders.searchRepositories({
        provider: "github",
        query: "web",
      });

      expect(error).toBeNull();
      expect(result).toEqual({
        status: "ok",
        repositories: [{ connectionId: "42", id: "7", fullName: "acme/web", private: true }],
        nextCursor: null,
      });
    });

    test("should explain why repositories can't be searched", async ({ admin: _ }) => {
      github.unconfigure();

      const [, result] = await serverClient.gitProviders.searchRepositories({ provider: "github" });

      expect(result).toEqual({
        status: "error",
        error: "github app is not configured on this instance",
      });
    });
  });
});
