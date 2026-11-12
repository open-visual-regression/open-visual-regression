import { headers } from "next/headers";
import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";

import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

const TEST_PASSWORD = "securepass123";

const inviteUser = async (email: string) => {
  const [, result] = await serverClient.users.invite({ email });

  return result!.invitationUrl.split("/").at(-1)!;
};

const acceptAsInvitee = async (invitationId: string) => {
  vi.mocked(headers).mockResolvedValue(new Headers());

  return serverClient.invitations.acceptInvitation({
    invitationId,
    name: "Invited User",
    password: TEST_PASSWORD,
  });
};

const findOrganizationUsers = async () => {
  const organization = await dbClient.organizations.getOrganization();
  const { rows } = await dbClient.users.findAllUsers({
    organizationId: organization!.id,
    limit: 50,
    offset: 0,
  });

  return rows;
};

describe("invitations", () => {
  describe("acceptInvitation", () => {
    test("should accept a pending invitation", async ({ admin: _ }) => {
      const invitationId = await inviteUser("accept-invitation@example.com");

      const [error] = await acceptAsInvitee(invitationId);

      expect(error).toBeNull();
    });

    test("should join the invited user to the organization", async ({ admin: _ }) => {
      const invitationId = await inviteUser("new-member@example.com");

      await acceptAsInvitee(invitationId);

      expect(await findOrganizationUsers()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: "new-member@example.com", status: "active" }),
        ]),
      );
    });

    test("should not leave an account without a membership behind", async ({ admin: _ }) => {
      const invitationId = await inviteUser("no-orphan@example.com");

      await acceptAsInvitee(invitationId);

      const account = await dbClient.users.findByEmail("no-orphan@example.com");
      const organizationUsers = await findOrganizationUsers();

      expect(account).not.toBeUndefined();
      expect(organizationUsers).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: account!.id, status: "active" })]),
      );
    });

    test("should return BAD_REQUEST when the invitation is no longer valid", async ({
      admin: _,
    }) => {
      const [error] = await acceptAsInvitee("00000000-0000-0000-0000-000000000000");

      expect(error?.code).toBe("BAD_REQUEST");
    });
  });
});
