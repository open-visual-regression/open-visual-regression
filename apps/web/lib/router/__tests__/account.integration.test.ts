import { headers } from "next/headers";
import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";
import { mocks } from "@ovr/mocks";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

const TEST_PASSWORD = "securepass123";

describe("account", () => {
  describe("updateAccountInformation", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.account.updateAccountInformation({
        name: "New Name",
        email: "new-name@openvisualregression.com",
      });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should update the user's name", async ({ reviewer }) => {
      const [error] = await serverClient.account.updateAccountInformation({
        name: "Updated Name",
        email: reviewer.email,
      });

      expect(error).toBeNull();

      const updated = await dbClient.users.findByEmail(reviewer.email);
      expect(updated?.name).toBe("Updated Name");
    });

    test("should update the user's email", async ({ reviewer }) => {
      const newEmail = "updated-email@openvisualregression.com";

      const [error] = await serverClient.account.updateAccountInformation({
        name: reviewer.name,
        email: newEmail,
      });

      expect(error).toBeNull();

      const updated = await dbClient.users.findByEmail(newEmail);
      expect(updated?.id).toBe(reviewer.id);
    });

    test("should return CONFLICT when the email belongs to another user", async ({ reviewer }) => {
      const generated = mocks.user.generateAuthUser();
      const other = { ...generated, email: generated.email.toLowerCase() };
      await auth.api.signUpEmail({
        body: { name: other.name, email: other.email, password: TEST_PASSWORD },
      });

      const [error] = await serverClient.account.updateAccountInformation({
        name: reviewer.name,
        email: other.email,
      });

      expect(error?.code).toBe("CONFLICT");
      expect(error?.message).toBe("this email is already in use");
    });

    test("should not modify another user's record", async ({ reviewer }) => {
      const generated = mocks.user.generateAuthUser();
      const other = { ...generated, email: generated.email.toLowerCase() };
      await auth.api.signUpEmail({
        body: { name: other.name, email: other.email, password: TEST_PASSWORD },
      });

      const [error] = await serverClient.account.updateAccountInformation({
        name: "Updated Name",
        email: reviewer.email,
      });

      expect(error).toBeNull();

      const otherRecord = await dbClient.users.findByEmail(other.email);
      expect(otherRecord?.name).toBe(other.name);
    });
  });

  describe("updatePassword", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.account.updatePassword({
        currentPassword: TEST_PASSWORD,
        newPassword: "newsecurepass456",
      });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should update the user's password", async ({ reviewer }) => {
      const [error] = await serverClient.account.updatePassword({
        currentPassword: TEST_PASSWORD,
        newPassword: "newsecurepass456",
      });

      expect(error).toBeNull();

      vi.mocked(headers).mockResolvedValue(new Headers());

      const signInResult = await auth.api.signInEmail({
        body: { email: reviewer.email, password: "newsecurepass456" },
      });

      expect(signInResult.user.id).toBe(reviewer.id);
    });

    test("should return BAD_REQUEST when the current password is incorrect", async ({
      reviewer: _reviewer,
    }) => {
      const [error] = await serverClient.account.updatePassword({
        currentPassword: "wrongpassword123",
        newPassword: "newsecurepass456",
      });

      expect(error?.code).toBe("BAD_REQUEST");
      expect(error?.message).toBe("Invalid password");
    });
  });
});
