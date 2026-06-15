import { vi } from "vitest";

import { test, describe, expect } from "@/lib/testing/fixtures";
import { serverClient } from "@/lib/router";

vi.mock("next/headers");

describe("users", () => {
  describe("list", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.users.list();
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await serverClient.users.list();
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return the users for an admin", async ({ admin }) => {
      const [error, result] = await serverClient.users.list();

      expect(error).toBeNull();
      expect(result?.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: "admin",
          }),
        ]),
      );
    });

    test("should include the last login time for a user that has signed in", async ({ admin }) => {
      const [, result] = await serverClient.users.list();

      const adminEntry = result?.users.find((u) => u.id === admin.id);
      expect(adminEntry?.lastLoginAt).toBeInstanceOf(Date);
    });

    test("should mark existing members as active", async ({ admin }) => {
      const [, result] = await serverClient.users.list();

      const adminEntry = result?.users.find((u) => u.id === admin.id);
      expect(adminEntry?.status).toBe("active");
      expect(adminEntry?.invitationUrl).toBeNull();
    });

    test("should include pending invitations with an invited status", async ({ admin: _ }) => {
      const [, inviteResult] = await serverClient.users.invite({ email: "pending@example.com" });

      const [, result] = await serverClient.users.list();

      const invitedEntry = result?.users.find((u) => u.email === "pending@example.com");
      expect(invitedEntry?.status).toBe("invited");
      expect(invitedEntry?.invitationUrl).toBe(inviteResult?.invitationUrl);
    });
  });

  describe("invite", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.users.invite({ email: "new.user@example.com" });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({ user: _ }) => {
      const [error] = await serverClient.users.invite({ email: "new.user@example.com" });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return an invitation url when invited by an admin", async ({ admin: _ }) => {
      const [error, result] = await serverClient.users.invite({ email: "new.user@example.com" });

      expect(error).toBeNull();
      expect(result?.invitationUrl).toMatch(/^http:\/\/localhost:3000\/invitations\/.+/);
    });

    test("should return BAD_REQUEST when the user is already invited", async ({ admin: _ }) => {
      await serverClient.users.invite({ email: "duplicate@example.com" });

      const [error] = await serverClient.users.invite({ email: "duplicate@example.com" });
      expect(error?.code).toBe("BAD_REQUEST");
    });
  });
});
