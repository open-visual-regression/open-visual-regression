import { convertSetCookieToCookie } from "better-auth/test";
import { headers } from "next/headers";
import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";
import { mocks } from "@ovr/mocks";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

const TEST_PASSWORD = "securepass123";

const inviteUser = async (email: string) => {
  const [, result] = await serverClient.users.invite({ email });

  return result!.invitationId;
};

const acceptInvitation = async (invitationId: string, adminEmail: string) => {
  vi.mocked(headers).mockResolvedValue(new Headers());

  const [error] = await serverClient.invitations.acceptInvitation({
    invitationId,
    name: "Invited User",
    password: TEST_PASSWORD,
  });
  expect(error).toBeNull();

  const response = await auth.api.signInEmail({
    body: { email: adminEmail, password: TEST_PASSWORD },
    asResponse: true,
  });
  vi.mocked(headers).mockResolvedValue(convertSetCookieToCookie(response.headers));
};

describe("users", () => {
  describe("list", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.users.list();
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
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

    test("should mark existing members as active", async ({ admin }) => {
      const [, result] = await serverClient.users.list();

      expect(result?.users).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: admin.id, status: "active" })]),
      );
    });

    test("should include pending invitations with an invited status", async ({ admin: _ }) => {
      await serverClient.users.invite({ email: "pending@example.com" });

      const [, result] = await serverClient.users.list();

      expect(result?.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: "pending@example.com",
            status: "invited",
            invitationUrl: expect.stringMatching(/^http:\/\/localhost:3000\/invitations\/.+/),
          }),
        ]),
      );
    });

    test("should sort users and invitations by name", async ({ admin: _ }) => {
      await serverClient.users.invite({ email: "zzz-test@example.com" });
      await serverClient.users.invite({ email: "aaa-test@example.com" });

      const [, result] = await serverClient.users.list();

      const names = result?.users.map((u) => u.name) ?? [];
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });

    test("should filter users by search term", async ({ admin: _ }) => {
      await serverClient.users.invite({ email: "searchable-match@example.com" });
      await serverClient.users.invite({ email: "unrelated@example.com" });

      const [error, result] = await serverClient.users.list({ search: "searchable" });

      expect(error).toBeNull();
      expect(result?.users).toHaveLength(1);
      expect(result?.users[0]).toMatchObject({ email: "searchable-match@example.com" });
      expect(result?.total).toBe(1);
    });

    test("should sort users by the given field and direction", async ({ admin: _ }) => {
      await serverClient.users.invite({ email: "aaa-sort@example.com" });
      await serverClient.users.invite({ email: "zzz-sort@example.com" });

      const [error, result] = await serverClient.users.list({
        sortBy: "email",
        sortDirection: "desc",
      });

      expect(error).toBeNull();

      const emails = result?.users.map((u) => u.email) ?? [];
      expect(emails.indexOf("zzz-sort@example.com")).toBeLessThan(
        emails.indexOf("aaa-sort@example.com"),
      );
    });

    test("should sort active users before invited users when sorting by status", async ({
      admin,
    }) => {
      await serverClient.users.invite({ email: "status-sort@example.com" });

      const [error, result] = await serverClient.users.list({
        sortBy: "status",
        sortDirection: "asc",
      });

      expect(error).toBeNull();

      const adminIndex = result?.users.findIndex((u) => u.id === admin.id) ?? -1;
      const invitedIndex =
        result?.users.findIndex((u) => u.email === "status-sort@example.com") ?? -1;
      expect(adminIndex).toBeLessThan(invitedIndex);
    });

    test("should sort users by createdAt without error", async ({ admin: _ }) => {
      await serverClient.users.invite({ email: "created-at-sort@example.com" });

      const [error, result] = await serverClient.users.list({
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      expect(error).toBeNull();
      expect(result?.users[0]).toMatchObject({ email: "created-at-sort@example.com" });
    });

    test("should respect limit and offset and return the total count", async ({ admin: _ }) => {
      await serverClient.users.invite({ email: "page-a@example.com" });
      await serverClient.users.invite({ email: "page-b@example.com" });
      await serverClient.users.invite({ email: "page-c@example.com" });

      const [, firstPage] = await serverClient.users.list({ limit: 2, offset: 0 });
      const [, secondPage] = await serverClient.users.list({ limit: 2, offset: 2 });

      expect(firstPage?.total).toBe(4);
      expect(firstPage?.users).toHaveLength(2);
      expect(secondPage?.users).toHaveLength(2);

      const firstIds = firstPage?.users.map((u) => u.id) ?? [];
      const secondIds = secondPage?.users.map((u) => u.id) ?? [];
      expect(new Set([...firstIds, ...secondIds]).size).toBe(4);
    });
  });

  describe("invite", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.users.invite({ email: "new.user@example.com" });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
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

  describe("remove", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.users.remove({
        users: [{ status: "active", email: "someone@example.com" }],
      });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.users.remove({
        users: [{ status: "active", email: "someone@example.com" }],
      });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return BAD_REQUEST when an admin tries to remove themselves", async ({
      admin,
    }) => {
      const [error] = await serverClient.users.remove({
        users: [{ status: "active", email: admin.email }],
      });
      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should remove an active member from the organization", async ({ admin }) => {
      const invitationId = await inviteUser("active-member@example.com");
      await acceptInvitation(invitationId, admin.email);

      const [error] = await serverClient.users.remove({
        users: [{ status: "active", email: "active-member@example.com" }],
      });

      expect(error).toBeNull();

      const [, result] = await serverClient.users.list();
      expect(result?.users).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ email: "active-member@example.com" })]),
      );
    });

    test("should cancel a pending invitation", async ({ admin: _ }) => {
      const invitationId = await inviteUser("cancel-me@example.com");

      const [error] = await serverClient.users.remove({
        users: [{ status: "invited", invitationId }],
      });

      expect(error).toBeNull();

      const [, result] = await serverClient.users.list();
      expect(result?.users).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ email: "cancel-me@example.com" })]),
      );
    });

    test("should return BAD_REQUEST when the invitation has already been accepted", async ({
      admin,
    }) => {
      const invitationId = await inviteUser("accepted-already@example.com");
      await acceptInvitation(invitationId, admin.email);

      const [error] = await serverClient.users.remove({
        users: [{ status: "invited", invitationId }],
      });

      expect(error?.code).toBe("BAD_REQUEST");
      expect(await dbClient.users.findByEmail("accepted-already@example.com")).not.toBeUndefined();
    });

    test("should not cancel any invitation when another one in the batch is not pending", async ({
      admin: _,
    }) => {
      const staleInvitationId = await inviteUser("stale@example.com");
      await serverClient.users.remove({
        users: [{ status: "invited", invitationId: staleInvitationId }],
      });
      const pendingInvitationId = await inviteUser("untouched@example.com");

      const [error] = await serverClient.users.remove({
        users: [
          { status: "invited", invitationId: pendingInvitationId },
          { status: "invited", invitationId: staleInvitationId },
        ],
      });

      expect(error?.code).toBe("BAD_REQUEST");

      const [, result] = await serverClient.users.list();
      expect(result?.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: "untouched@example.com", status: "invited" }),
        ]),
      );
    });

    test("should remove active members and pending invitations in a single call", async ({
      admin,
    }) => {
      const acceptedInvitationId = await inviteUser("batched-member@example.com");
      await acceptInvitation(acceptedInvitationId, admin.email);
      const invitationId = await inviteUser("batched-invite@example.com");

      const [error] = await serverClient.users.remove({
        users: [
          { status: "active", email: "batched-member@example.com" },
          { status: "invited", invitationId },
        ],
      });

      expect(error).toBeNull();

      const [, result] = await serverClient.users.list();
      const emails = result?.users.map((user) => user.email) ?? [];

      expect(emails).not.toContain("batched-member@example.com");
      expect(emails).not.toContain("batched-invite@example.com");
    });

    test("should allow re-inviting an email whose invitation was cancelled", async ({
      admin: _,
    }) => {
      const invitationId = await inviteUser("reinvite-me@example.com");
      await serverClient.users.remove({
        users: [{ status: "invited", invitationId }],
      });

      const [error] = await serverClient.users.invite({ email: "reinvite-me@example.com" });

      expect(error).toBeNull();
    });
  });

  describe("changeRole", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.users.changeRole({
        userId: "00000000-0000-0000-0000-000000000000",
        role: "admin",
      });
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.users.changeRole({
        userId: "00000000-0000-0000-0000-000000000000",
        role: "admin",
      });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return FORBIDDEN when an admin targets their own role", async ({ admin }) => {
      const [error] = await serverClient.users.changeRole({ userId: admin.id, role: "viewer" });
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should promote another user to admin", async ({ admin: _ }) => {
      const { name, email } = mocks.user.generateAuthUser();
      const { user: target } = await auth.api.createUser({
        body: { name, email, password: TEST_PASSWORD, role: "reviewer" },
      });

      const [error] = await serverClient.users.changeRole({ userId: target.id, role: "admin" });

      expect(error).toBeNull();
      const updated = await dbClient.users.findById(target.id);
      expect(updated?.role).toBe("admin");
    });

    test("should demote another user to a viewer", async ({ admin: _ }) => {
      const { name, email } = mocks.user.generateAuthUser();
      const { user: target } = await auth.api.createUser({
        body: { name, email, password: TEST_PASSWORD, role: "admin" },
      });

      const [error] = await serverClient.users.changeRole({ userId: target.id, role: "viewer" });

      expect(error).toBeNull();
      const updated = await dbClient.users.findById(target.id);
      expect(updated?.role).toBe("viewer");
    });
  });
});
