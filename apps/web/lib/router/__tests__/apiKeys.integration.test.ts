// @vitest-environment node

import { describe, expect, test, vi } from "vitest";
import { headers } from "next/headers";
import { convertSetCookieToCookie } from "better-auth/test";

import { mocks } from "@ovr/mocks";
import { auth } from "@/lib/auth/auth";
import { router } from "@/lib/router";

vi.mock("next/headers");

const TEST_PASSWORD = "securepass123";

interface AdminContext {
  userId: string;
}

const it = test.extend<{
  adminContext: AdminContext;
  userContext: Record<string, never>;
}>({
  adminContext: async (_ctx, use) => {
    const { name, email } = mocks.user.generateUser();
    const { user } = await auth.api.createUser({
      body: { name, email, password: TEST_PASSWORD, role: "admin" },
    });
    const response = await auth.api.signInEmail({
      body: { email, password: TEST_PASSWORD },
      asResponse: true,
    });
    vi.mocked(headers).mockResolvedValue(convertSetCookieToCookie(response.headers));
    await use({ userId: user.id });
    vi.mocked(headers).mockResolvedValue(new Headers());
  },

  userContext: async (_ctx, use) => {
    const { name, email } = mocks.user.generateUser();
    const response = await auth.api.signUpEmail({
      body: { name, email, password: TEST_PASSWORD },
      asResponse: true,
    });
    vi.mocked(headers).mockResolvedValue(convertSetCookieToCookie(response.headers));
    await use({});
    vi.mocked(headers).mockResolvedValue(new Headers());
  },
});

describe("apiKeys", () => {
  describe("create", () => {
    it("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await router.apiKeys.create({ name: "my key" });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    it("should return FORBIDDEN when the session user is not an admin", async ({
      userContext: _,
    }) => {
      const [error] = await router.apiKeys.create({ name: "my key" });
      expect(error?.code).toBe("FORBIDDEN");
    });

    it("should return the api key when created by an admin", async ({ adminContext: _ }) => {
      const [error, result] = await router.apiKeys.create({ name: "my key" });
      expect(error).toBeNull();
      expect(result?.key).toMatch(/^ovr_api_key_/);
    });

    it("should persist the api key to the database when created by an admin", async ({
      adminContext: _,
    }) => {
      await router.apiKeys.create({ name: "persist test key" });
      const [, list] = await router.apiKeys.list({});
      expect(list?.apiKeys.some((k) => k.name === "persist test key")).toBe(true);
    });
  });

  describe("list", () => {
    it("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await router.apiKeys.list({});
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    it("should return FORBIDDEN when the session user is not an admin", async ({
      userContext: _,
    }) => {
      const [error] = await router.apiKeys.list({});
      expect(error?.code).toBe("FORBIDDEN");
    });

    it("should return an empty list when the admin has no keys", async ({ adminContext: _ }) => {
      const [error, result] = await router.apiKeys.list({});
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(0);
      expect(result?.total).toBe(0);
    });

    it("should return the api keys for the admin", async ({ adminContext: _ }) => {
      await router.apiKeys.create({ name: "key one" });
      await router.apiKeys.create({ name: "key two" });
      const [error, result] = await router.apiKeys.list({});
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(2);
      expect(result?.total).toBe(2);
    });

    it("should respect the limit and offset params", async ({ adminContext: _ }) => {
      await router.apiKeys.create({ name: "key one" });
      await router.apiKeys.create({ name: "key two" });
      await router.apiKeys.create({ name: "key three" });
      const [error, result] = await router.apiKeys.list({ limit: 2, offset: 1 });
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(2);
      expect(result?.total).toBe(3);
    });
  });

  describe("revoke", () => {
    it("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await router.apiKeys.revoke({ keyId: "fake-id" });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    it("should return FORBIDDEN when the session user is not an admin", async ({
      userContext: _,
    }) => {
      const [error] = await router.apiKeys.revoke({ keyId: "fake-id" });
      expect(error?.code).toBe("FORBIDDEN");
    });

    it("should delete the api key from the database when revoked by an admin", async ({
      adminContext: _,
    }) => {
      await router.apiKeys.create({ name: "revoke test key" });
      const [, beforeList] = await router.apiKeys.list({});
      const key = beforeList?.apiKeys.find((k) => k.name === "revoke test key");
      expect(key).toBeDefined();

      const [error] = await router.apiKeys.revoke({ keyId: key!.id });
      expect(error).toBeNull();

      const [, afterList] = await router.apiKeys.list({});
      expect(afterList?.apiKeys.find((k) => k.name === "revoke test key")).toBeUndefined();
    });
  });
});
