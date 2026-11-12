import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";

import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

describe("organizations", () => {
  describe("getOne", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.organizations.getOne();
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return the organization for an authenticated user", async ({ admin: _ }) => {
      const organization = await dbClient.organizations.getOrganization();

      const [error, result] = await serverClient.organizations.getOne();

      expect(error).toBeNull();
      expect(result?.organization).toMatchObject({
        id: organization!.id,
        name: organization!.name,
      });
    });
  });

  describe("update", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.organizations.update({ name: "New Name" });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.organizations.update({ name: "New Name" });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return BAD_REQUEST when the name is empty", async ({ admin: _ }) => {
      const [error] = await serverClient.organizations.update({ name: "" });
      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should update the organization name when the session user is an admin", async ({
      admin: _,
    }) => {
      const [error] = await serverClient.organizations.update({ name: "Renamed Org" });

      expect(error).toBeNull();

      const [, getResult] = await serverClient.organizations.getOne();
      expect(getResult?.organization.name).toBe("Renamed Org");
    });
  });
});
