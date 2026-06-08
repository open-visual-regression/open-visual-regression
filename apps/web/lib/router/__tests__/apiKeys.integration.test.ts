// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { headers } from "next/headers";
import { faker } from "@faker-js/faker";

import { db, sql } from "@ovr/db/dbClient";
import { auth } from "@/lib/auth/auth";
import { router } from "@/lib/router";

vi.mock("next/headers");

beforeEach(() => {
  vi.mocked(headers).mockResolvedValue(new Headers() as never);
});

async function setupAdmin() {
  const email = faker.internet.email();
  const password = faker.internet.password({ length: 12 });
  const { user } = await auth.api.signUpEmail({ body: { name: "Test Admin", email, password } });
  await db.execute(sql`UPDATE "user" SET role = 'admin' WHERE id = ${user.id}`);
  const response = (await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  })) as unknown as Response;
  const cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
  return { userId: user.id, cookie };
}

async function setupUser() {
  const email = faker.internet.email();
  const password = faker.internet.password({ length: 12 });
  const response = (await auth.api.signUpEmail({
    body: { name: "Test User", email, password },
    asResponse: true,
  })) as unknown as Response;
  return response.headers.get("set-cookie")?.split(";")[0] ?? "";
}

describe("apiKeys", () => {
  describe("create", () => {
    it("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await router.apiKeys.create({ name: "my key" });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    it("should return FORBIDDEN when the session user is not an admin", async () => {
      const cookie = await setupUser();
      vi.mocked(headers).mockResolvedValueOnce(new Headers({ cookie }) as never);
      const [error] = await router.apiKeys.create({ name: "my key" });
      expect(error?.code).toBe("FORBIDDEN");
    });

    it("should return the api key when created by an admin", async () => {
      const { cookie } = await setupAdmin();
      vi.mocked(headers).mockResolvedValueOnce(new Headers({ cookie }) as never);
      const [error, result] = await router.apiKeys.create({ name: "my key" });
      expect(error).toBeNull();
      expect(result?.key).toMatch(/^ovr_api_key_/);
    });

    it("should persist the api key to the database when created by an admin", async () => {
      const { cookie, userId } = await setupAdmin();
      vi.mocked(headers).mockResolvedValueOnce(new Headers({ cookie }) as never);
      await router.apiKeys.create({ name: "persisted key" });
      const rows = await db.execute(
        sql`SELECT * FROM apikey WHERE reference_id = ${userId} AND name = 'persisted key'`,
      );
      expect(rows.rows).toHaveLength(1);
    });
  });

  describe("list", () => {
    it("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await router.apiKeys.list({});
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    it("should return FORBIDDEN when the session user is not an admin", async () => {
      const cookie = await setupUser();
      vi.mocked(headers).mockResolvedValueOnce(new Headers({ cookie }) as never);
      const [error] = await router.apiKeys.list({});
      expect(error?.code).toBe("FORBIDDEN");
    });

    it("should return an empty list when the admin has no keys", async () => {
      const { cookie } = await setupAdmin();
      vi.mocked(headers).mockResolvedValueOnce(new Headers({ cookie }) as never);
      const [error, result] = await router.apiKeys.list({});
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(0);
      expect(result?.total).toBe(0);
    });

    it("should return the api keys for the admin", async () => {
      const { cookie, userId } = await setupAdmin();
      await auth.api.createApiKey({ body: { name: "key one", prefix: "ovr_api_key_", userId } });
      await auth.api.createApiKey({ body: { name: "key two", prefix: "ovr_api_key_", userId } });
      vi.mocked(headers).mockResolvedValueOnce(new Headers({ cookie }) as never);
      const [error, result] = await router.apiKeys.list({});
      expect(error).toBeNull();
      expect(result?.apiKeys).toHaveLength(2);
      expect(result?.total).toBe(2);
    });

    it("should respect the limit and offset params", async () => {
      const { cookie, userId } = await setupAdmin();
      await auth.api.createApiKey({ body: { name: "key one", prefix: "ovr_api_key_", userId } });
      await auth.api.createApiKey({ body: { name: "key two", prefix: "ovr_api_key_", userId } });
      await auth.api.createApiKey({ body: { name: "key three", prefix: "ovr_api_key_", userId } });
      vi.mocked(headers).mockResolvedValueOnce(new Headers({ cookie }) as never);
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

    it("should return FORBIDDEN when the session user is not an admin", async () => {
      const cookie = await setupUser();
      vi.mocked(headers).mockResolvedValueOnce(new Headers({ cookie }) as never);
      const [error] = await router.apiKeys.revoke({ keyId: "fake-id" });
      expect(error?.code).toBe("FORBIDDEN");
    });

    it("should delete the api key from the database when revoked by an admin", async () => {
      const { cookie, userId } = await setupAdmin();
      const { id } = await auth.api.createApiKey({
        body: { name: "to revoke", prefix: "ovr_api_key_", userId },
      });
      vi.mocked(headers).mockResolvedValueOnce(new Headers({ cookie }) as never);
      const [error] = await router.apiKeys.revoke({ keyId: id });
      expect(error).toBeNull();
      const rows = await db.execute(sql`SELECT * FROM apikey WHERE id = ${id}`);
      expect(rows.rows).toHaveLength(0);
    });
  });
});
