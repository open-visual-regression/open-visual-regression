import { vi } from "vitest";
import { headers } from "next/headers";

import { test, describe, expect } from "@/lib/testing/fixtures";
import { serverClient } from "@/lib/router";
import { auth } from "@/lib/auth/auth";
import { dbClient } from "@ovr/db/client";
import { mocks } from "@ovr/mocks";

vi.mock("next/headers");

const TEST_PASSWORD = "securepass123";

describe("profile", () => {
  describe("updateProfileInformation", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.profile.updateProfileInformation({
        name: "New Name",
        email: "new-name@openvisualregression.com",
      });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should update the user's name", async ({ user }) => {
      const [error] = await serverClient.profile.updateProfileInformation({
        name: "Updated Name",
        email: user.email,
      });

      expect(error).toBeNull();

      const updated = await dbClient.users.findByEmail(user.email);
      expect(updated?.name).toBe("Updated Name");
    });

    test("should update the user's email", async ({ user }) => {
      const newEmail = "updated-email@openvisualregression.com";

      const [error] = await serverClient.profile.updateProfileInformation({
        name: user.name,
        email: newEmail,
      });

      expect(error).toBeNull();

      const updated = await dbClient.users.findByEmail(newEmail);
      expect(updated?.id).toBe(user.id);
    });

    test("should return CONFLICT when the email belongs to another user", async ({ user }) => {
      const other = mocks.user.generateUser();
      other.email = other.email.toLowerCase();
      await auth.api.signUpEmail({
        body: { name: other.name, email: other.email, password: TEST_PASSWORD },
      });

      const [error] = await serverClient.profile.updateProfileInformation({
        name: user.name,
        email: other.email,
      });

      expect(error?.code).toBe("CONFLICT");
      expect(error?.message).toBe("this email is already in use");
    });

    test("should not modify another user's record", async ({ user }) => {
      const other = mocks.user.generateUser();
      other.email = other.email.toLowerCase();
      await auth.api.signUpEmail({
        body: { name: other.name, email: other.email, password: TEST_PASSWORD },
      });

      const [error] = await serverClient.profile.updateProfileInformation({
        name: "Updated Name",
        email: user.email,
      });

      expect(error).toBeNull();

      const otherRecord = await dbClient.users.findByEmail(other.email);
      expect(otherRecord?.name).toBe(other.name);
    });
  });

  describe("updatePassword", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.profile.updatePassword({
        currentPassword: TEST_PASSWORD,
        newPassword: "newsecurepass456",
      });

      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should update the user's password", async ({ user }) => {
      const [error] = await serverClient.profile.updatePassword({
        currentPassword: TEST_PASSWORD,
        newPassword: "newsecurepass456",
      });

      expect(error).toBeNull();

      vi.mocked(headers).mockResolvedValue(new Headers());

      const signInResult = await auth.api.signInEmail({
        body: { email: user.email, password: "newsecurepass456" },
      });

      expect(signInResult.user.id).toBe(user.id);
    });

    test("should return BAD_REQUEST when the current password is incorrect", async ({
      user: _user,
    }) => {
      const [error] = await serverClient.profile.updatePassword({
        currentPassword: "wrongpassword123",
        newPassword: "newsecurepass456",
      });

      expect(error?.code).toBe("BAD_REQUEST");
      expect(error?.message).toBe("Invalid password");
    });
  });
});
