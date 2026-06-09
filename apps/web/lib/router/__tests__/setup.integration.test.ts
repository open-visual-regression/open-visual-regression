import { describe, expect, it, vi } from "vitest";

import { mocks } from "@ovr/mocks";
import * as schema from "@ovr/db/schema";
import { db } from "@ovr/db/db";

import { router } from "@/lib/router";
import { auth } from "@/lib/auth/auth";

vi.mock("next/headers");
vi.mock("@/lib/auth/auth");

describe("setup", () => {
  const mockCreateUser = vi.mocked(auth.api.createUser);
  const mockCreateOrganization = vi.mocked(auth.api.createOrganization);

  describe("setup.status", () => {
    it("should return pending when DB is empty", async () => {
      const [error, result] = await router.setup.status();
      expect(error).toBeNull();
      expect(result?.status).toBe("pending");
    });

    it("should return pending when only users exist", async () => {
      await db.insert(schema.user).values(mocks.user.generateUser());

      const [error, result] = await router.setup.status();
      expect(error).toBeNull();
      expect(result?.status).toBe("pending");
    });

    it("should return pending when only orgs exist", async () => {
      await db.insert(schema.organization).values(mocks.organization.generateOrganization());

      const [error, result] = await router.setup.status();
      expect(error).toBeNull();
      expect(result?.status).toBe("pending");
    });

    it("should return completed when both users and orgs exist", async () => {
      await db.insert(schema.user).values(mocks.user.generateUser());
      await db.insert(schema.organization).values(mocks.organization.generateOrganization());

      const [error, result] = await router.setup.status();
      expect(error).toBeNull();
      expect(result?.status).toBe("completed");
    });
  });

  describe("setup.exec", () => {
    const input = {
      organizationName: "My Test Org",
      name: "Test User",
      email: "test@example.com",
      password: "securepass123",
    };

    it("should create the admin account and organization", async () => {
      const user = mocks.user.generateUser();
      const org = mocks.organization.generateOrganization();
      mockCreateUser.mockResolvedValue({ user: { ...user, role: user.role ?? undefined } });
      mockCreateOrganization.mockResolvedValue({ ...org, members: [] });

      const [error] = await router.setup.exec(input);
      expect(error).toBeNull();

      expect(mockCreateUser).toHaveBeenCalledWith({
        body: { name: input.name, email: input.email, password: input.password, role: "admin" },
      });

      expect(mockCreateOrganization).toHaveBeenCalledWith({
        body: { name: input.organizationName, slug: "my-test-org", userId: user.id },
      });
    });

    it("should generate slug from org name with spaces and special chars", async () => {
      const user = mocks.user.generateUser();
      mockCreateUser.mockResolvedValue({ user: { ...user, role: user.role ?? undefined } });
      mockCreateOrganization.mockResolvedValue({
        ...mocks.organization.generateOrganization(),
        members: [],
      });

      await router.setup.exec({ ...input, organizationName: "Tom Fischer's Org & Co!" });

      expect(mockCreateOrganization).toHaveBeenCalledWith({
        body: expect.objectContaining({ slug: "tom-fischers-org--co" }),
      });
    });

    it("should return INTERNAL_SERVER_ERROR when signUpEmail returns no user", async () => {
      mockCreateUser.mockResolvedValue(null as never);

      const [error] = await router.setup.exec(input);
      expect(error?.message).toBe("Failed to create the admin user");
      expect(mockCreateOrganization).not.toHaveBeenCalled();
    });
  });
});
