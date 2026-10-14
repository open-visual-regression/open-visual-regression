import { vi } from "vitest";

import { usesTrustedProxy } from "@/lib/auth/config";
import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");
vi.mock("@/lib/auth/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/config")>()),
  usesTrustedProxy: vi.fn(() => false),
}));

const ID = "00000000-0000-0000-0000-000000000000";

describe("localAuthMiddleware", () => {
  test.for([
    [
      "setup.exec",
      () =>
        serverClient.setup.exec({
          name: "Admin",
          email: "admin@example.com",
          password: "securepass123",
          organizationName: "Acme",
        }),
    ],
    [
      "invitations.getInvitation",
      () => serverClient.invitations.getInvitation({ invitationId: ID }),
    ],
    [
      "invitations.acceptInvitation",
      () =>
        serverClient.invitations.acceptInvitation({
          invitationId: ID,
          name: "Jane",
          password: "securepass123",
        }),
    ],
    ["users.invite", () => serverClient.users.invite({ email: "jane@example.com" })],
    [
      "users.remove",
      () => serverClient.users.remove({ users: [{ status: "active", email: "jane@example.com" }] }),
    ],
    ["users.changeRole", () => serverClient.users.changeRole({ userId: ID, role: "viewer" })],
    [
      "account.updateAccountInformation",
      () =>
        serverClient.account.updateAccountInformation({ name: "Jane", email: "jane@example.com" }),
    ],
    [
      "account.updatePassword",
      () =>
        serverClient.account.updatePassword({
          currentPassword: "securepass123",
          newPassword: "newsecurepass456",
        }),
    ],
  ] as const)(
    "should forbid %s when sign-in goes through a trusted proxy",
    async ([, call], { admin: _ }) => {
      vi.mocked(usesTrustedProxy).mockReturnValue(true);

      const [error] = await call();

      expect(error).toMatchObject({
        code: "FORBIDDEN",
        message: "this is managed by your identity provider",
      });
    },
  );

  test("should allow local auth procedures in local mode", async ({ admin: _ }) => {
    vi.mocked(usesTrustedProxy).mockReturnValue(false);

    const [error] = await serverClient.users.invite({ email: "jane@example.com" });

    expect(error).toBeNull();
  });
});
