import { convertSetCookieToCookie } from "better-auth/test";
import { headers } from "next/headers";
import { vi } from "vitest";

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

    test("should replace the account left behind by an earlier failed attempt", async ({
      admin,
    }) => {
      const invitationId = await inviteUser("retried@example.com");
      await auth.api.signUpEmail({
        body: { name: "Retried", email: "retried@example.com", password: "an-old-password" },
      });

      vi.mocked(headers).mockResolvedValue(new Headers());

      const [error] = await serverClient.invitations.acceptInvitation({
        invitationId,
        name: "Retried",
        password: TEST_PASSWORD,
      });

      expect(error).toBeNull();

      const signInResult = await auth.api.signInEmail({
        body: { email: "retried@example.com", password: TEST_PASSWORD },
      });
      expect(signInResult.user.email).toBe("retried@example.com");

      const adminSignIn = await auth.api.signInEmail({
        body: { email: admin.email, password: TEST_PASSWORD },
        asResponse: true,
      });
      vi.mocked(headers).mockResolvedValue(convertSetCookieToCookie(adminSignIn.headers));

      const [, result] = await serverClient.users.list();
      expect(result?.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: "retried@example.com", status: "active" }),
        ]),
      );
    });
  });
});
