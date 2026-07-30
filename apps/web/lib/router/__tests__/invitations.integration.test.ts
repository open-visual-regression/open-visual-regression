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

const signInAs = async (email: string) => {
  const response = await auth.api.signInEmail({
    body: { email, password: TEST_PASSWORD },
    asResponse: true,
  });
  vi.mocked(headers).mockResolvedValue(convertSetCookieToCookie(response.headers));
};

const createAccount = async (email: string) => {
  await auth.api.signUpEmail({
    body: { name: "Invited User", email, password: TEST_PASSWORD },
  });
};

describe("invitations", () => {
  describe("getInvitation", () => {
    test("should return the invitation details for a pending invitation", async ({ admin: _ }) => {
      const invitationId = await inviteUser("get-invitation@example.com");

      const [error, result] = await serverClient.invitations.getInvitation({ invitationId });

      expect(error).toBeNull();
      expect(result).toMatchObject({ email: "get-invitation@example.com", hasAccount: false });
    });

    test("should report that the invited email already has an account", async ({ admin: _ }) => {
      const invitationId = await inviteUser("has-account@example.com");
      await createAccount("has-account@example.com");

      const [, result] = await serverClient.invitations.getInvitation({ invitationId });

      expect(result?.hasAccount).toBe(true);
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
    test("should return UNAUTHORIZED when there is no session", async ({ admin: _ }) => {
      const invitationId = await inviteUser("no-session@example.com");

      vi.mocked(headers).mockResolvedValue(new Headers());

      const [error] = await serverClient.invitations.acceptInvitation({ invitationId });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should accept a pending invitation without requiring email verification", async ({
      admin: _,
    }) => {
      const invitationId = await inviteUser("accept-invitation@example.com");
      await createAccount("accept-invitation@example.com");
      await signInAs("accept-invitation@example.com");

      const [error] = await serverClient.invitations.acceptInvitation({ invitationId });

      expect(error).toBeNull();
    });

    test("should add the accepting user as an organization member", async ({ admin }) => {
      const invitationId = await inviteUser("new-member@example.com");
      await createAccount("new-member@example.com");
      await signInAs("new-member@example.com");

      await serverClient.invitations.acceptInvitation({ invitationId });

      await signInAs(admin.email);
      const [, result] = await serverClient.users.list();

      expect(result?.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: "new-member@example.com", status: "active" }),
        ]),
      );
    });

    test("should let an account stranded by an earlier attempt accept after signing in", async ({
      admin,
    }) => {
      const invitationId = await inviteUser("stranded@example.com");
      await createAccount("stranded@example.com");
      const stranded = await dbClient.users.findByEmail("stranded@example.com");

      await signInAs("stranded@example.com");
      const [error] = await serverClient.invitations.acceptInvitation({ invitationId });

      expect(error).toBeNull();

      await signInAs(admin.email);
      const [, result] = await serverClient.users.list();

      expect(result?.users).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: stranded!.id, status: "active" })]),
      );
    });

    test("should return FORBIDDEN when signed in as a different email", async ({ admin }) => {
      const invitationId = await inviteUser("not-me@example.com");

      const [error] = await serverClient.invitations.acceptInvitation({ invitationId });

      expect(error?.code).toBe("FORBIDDEN");
      expect(error?.message).toContain("not-me@example.com");
      expect(admin.email).not.toBe("not-me@example.com");
    });

    test("should return BAD_REQUEST for an invitation that does not exist", async ({
      admin: _,
    }) => {
      const [error] = await serverClient.invitations.acceptInvitation({
        invitationId: "00000000-0000-0000-0000-000000000000",
      });

      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should return BAD_REQUEST when the invitation was already accepted", async ({
      admin: _,
    }) => {
      const invitationId = await inviteUser("accepted-twice@example.com");
      await createAccount("accepted-twice@example.com");
      await signInAs("accepted-twice@example.com");

      const [firstError] = await serverClient.invitations.acceptInvitation({ invitationId });
      expect(firstError).toBeNull();

      const [error] = await serverClient.invitations.acceptInvitation({ invitationId });

      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should return BAD_REQUEST when the invitation was cancelled", async ({ admin: _ }) => {
      const invitationId = await inviteUser("cancelled@example.com");
      await createAccount("cancelled@example.com");
      await serverClient.users.remove({ users: [{ status: "invited", invitationId }] });

      await signInAs("cancelled@example.com");
      const [error] = await serverClient.invitations.acceptInvitation({ invitationId });

      expect(error?.code).toBe("BAD_REQUEST");
    });
  });
});
