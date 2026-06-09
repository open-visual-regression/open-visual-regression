import { vi } from "vitest";

import { test, describe, expect } from "@/lib/testing/fixtures";
import { router } from "@/lib/router";

vi.mock("next/headers");

describe("apiKeys", () => {
  describe("create", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await router.apiKeys.create({ name: "my key" });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await router.apiKeys.create({ name: "my key" });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return the api key when created by an admin", async ({ admin: _ }) => {
      const [error, result] = await router.apiKeys.create({ name: "my key" });
      expect(error).toBeNull();
      expect(result?.key).toMatch(/^ovr_api_key_/);
    });

    test("should persist the api key to the database when created by an admin", async ({
      admin: _,
    }) => {
      await router.apiKeys.create({ name: "persist test key" });
      const [, list] = await router.apiKeys.list({});
      expect(list?.apiKeys).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "persist test key" })]),
      );
    });
  });

  describe("list", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await router.apiKeys.list({});
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await router.apiKeys.list({});
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return an empty list when the admin has no keys", async ({ admin: _ }) => {
      const [error, result] = await router.apiKeys.list({});
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(0);
      expect(result?.total).toBe(0);
    });

    test("should return the api keys for the admin", async ({ admin: _ }) => {
      await router.apiKeys.create({ name: "key one" });
      await router.apiKeys.create({ name: "key two" });
      const [error, result] = await router.apiKeys.list({});
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(2);
      expect(result?.total).toBe(2);
    });

    test("should respect the limit and offset params", async ({ admin: _ }) => {
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
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await router.apiKeys.revoke({ keyId: "fake-id" });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await router.apiKeys.revoke({ keyId: "fake-id" });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should delete the api key from the database when revoked by an admin", async ({
      admin: _,
    }) => {
      await router.apiKeys.create({ name: "revoke test key" });
      const [, beforeList] = await router.apiKeys.list({});
      expect(beforeList?.apiKeys).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "revoke test key" })]),
      );

      const [key] = beforeList!.apiKeys;
      const [error] = await router.apiKeys.revoke({ keyId: key!.id });
      expect(error).toBeNull();

      const [, afterList] = await router.apiKeys.list({});
      expect(afterList?.apiKeys).toHaveLength(0);
    });
  });
});
