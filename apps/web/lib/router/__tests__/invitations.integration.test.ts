import { convertSetCookieToCookie } from "better-auth/test";
import { headers } from "next/headers";
import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

const TEST_PASSWORD = "securepass123";

const inviteUser = async (email: string) => {
  const [, result] = await serverClient.users.invite({ email });
  return result!.invitationId;
};

describe("invitations", () => {
  describe("getInvitation", () => {
    test("should return the invitation details for a pending invitation", async ({ admin: _ }) => {
      const invitationId = await inviteUser("get-invitation@example.com");

      const [error, result] = await serverClient.invitations.getInvitation({ invitationId });

      expect(error).toBeNull();
      expect(result).toMatchObject({ email: "get-invitation@example.com" });
    });

    test("should return NOT_FOUND for an invitation that does not exist", async () => {
      const [error] = await serverClient.invitations.getInvitation({
        invitationId: "00000000-0000-0000-0000-000000000000",
      });

      expect(error?.code).toBe("NOT_FOUND");
    });

    test("should return NOT_FOUND for an invitation that is no longer pending", async ({
      admin: _,
    }) => {
      const invitationId = await inviteUser("no-longer-pending@example.com");
      await serverClient.users.remove({ users: [{ status: "invited", invitationId }] });

      const [error] = await serverClient.invitations.getInvitation({ invitationId });

      expect(error?.code).toBe("NOT_FOUND");
    });
  });

  describe("acceptInvitation", () => {
    test("should return FORBIDDEN when a session already exists", async ({ admin: _ }) => {
      const invitationId = await inviteUser("already-signed-in@example.com");

      const [error] = await serverClient.invitations.acceptInvitation({
        invitationId,
        name: "Invited User",
        password: TEST_PASSWORD,
      });

      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should accept a pending invitation without requiring email verification", async ({
      admin: _,
    }) => {
      const invitationId = await inviteUser("accept-invitation@example.com");

      vi.mocked(headers).mockResolvedValue(new Headers());

      const [error] = await serverClient.invitations.acceptInvitation({
        invitationId,
        name: "Invited User",
        password: TEST_PASSWORD,
      });

      expect(error).toBeNull();

      const signInResult = await auth.api.signInEmail({
        body: { email: "accept-invitation@example.com", password: TEST_PASSWORD },
      });

      expect(signInResult.user.email).toBe("accept-invitation@example.com");
    });

    test("should add the accepting user as an organization member", async ({ admin }) => {
      const invitationId = await inviteUser("new-member@example.com");

      vi.mocked(headers).mockResolvedValue(new Headers());

      const [acceptError] = await serverClient.invitations.acceptInvitation({
        invitationId,
        name: "Invited User",
        password: TEST_PASSWORD,
      });
      expect(acceptError).toBeNull();

      const adminSignIn = await auth.api.signInEmail({
        body: { email: admin.email, password: TEST_PASSWORD },
        asResponse: true,
      });
      vi.mocked(headers).mockResolvedValue(convertSetCookieToCookie(adminSignIn.headers));

      const [, result] = await serverClient.users.list();

      expect(result?.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: "new-member@example.com", status: "active" }),
        ]),
      );
    });

    test("should return BAD_REQUEST for an invitation that does not exist", async () => {
      vi.mocked(headers).mockResolvedValue(new Headers());

      const [error] = await serverClient.invitations.acceptInvitation({
        invitationId: "00000000-0000-0000-0000-000000000000",
        name: "Invited User",
        password: TEST_PASSWORD,
      });

      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should return BAD_REQUEST when the invitation was already accepted", async ({
      admin: _,
    }) => {
      const invitationId = await inviteUser("accepted-twice@example.com");

      vi.mocked(headers).mockResolvedValue(new Headers());

      const [firstError] = await serverClient.invitations.acceptInvitation({
        invitationId,
        name: "Invited User",
        password: TEST_PASSWORD,
      });
      expect(firstError).toBeNull();

      const [error] = await serverClient.invitations.acceptInvitation({
        invitationId,
        name: "Invited User",
        password: TEST_PASSWORD,
      });

      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should let an existing account claim the invitation with its own password", async ({
      admin,
    }) => {
      const invitationId = await inviteUser("existing@example.com");
      await auth.api.signUpEmail({
        body: { name: "Existing", email: "existing@example.com", password: TEST_PASSWORD },
      });
      const existingUser = await dbClient.users.findByEmail("existing@example.com");

      vi.mocked(headers).mockResolvedValue(new Headers());

      const [error] = await serverClient.invitations.acceptInvitation({
        invitationId,
        password: TEST_PASSWORD,
      });

      expect(error).toBeNull();

      const adminSignIn = await auth.api.signInEmail({
        body: { email: admin.email, password: TEST_PASSWORD },
        asResponse: true,
      });
      vi.mocked(headers).mockResolvedValue(convertSetCookieToCookie(adminSignIn.headers));

      const [, result] = await serverClient.users.list();
      expect(result?.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: existingUser!.id, status: "active" }),
        ]),
      );
    });

    test("should return BAD_REQUEST when the password does not match the existing account", async ({
      admin: _,
    }) => {
      const invitationId = await inviteUser("wrong-password@example.com");
      await auth.api.signUpEmail({
        body: { name: "Existing", email: "wrong-password@example.com", password: TEST_PASSWORD },
      });

      vi.mocked(headers).mockResolvedValue(new Headers());

      const [error] = await serverClient.invitations.acceptInvitation({
        invitationId,
        password: "not-the-right-password",
      });

      expect(error?.code).toBe("BAD_REQUEST");
      expect(await dbClient.users.findByEmail("wrong-password@example.com")).not.toBeUndefined();
    });

    test("should report whether the invited email already has an account", async ({ admin: _ }) => {
      const withoutAccount = await inviteUser("no-account@example.com");
      const withAccount = await inviteUser("has-account@example.com");
      await auth.api.signUpEmail({
        body: { name: "Has Account", email: "has-account@example.com", password: TEST_PASSWORD },
      });

      const [, missing] = await serverClient.invitations.getInvitation({
        invitationId: withoutAccount,
      });
      const [, present] = await serverClient.invitations.getInvitation({
        invitationId: withAccount,
      });

      expect(missing?.hasAccount).toBe(false);
      expect(present?.hasAccount).toBe(true);
    });
  });
});
