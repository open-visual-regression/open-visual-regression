import { vi } from "vitest";

import { test, describe, expect } from "@/lib/testing/fixtures";
import { router } from "@/lib/router";
import { dbClient } from "@ovr/db/client";
import { type ExecSetupInputSchema } from "@ovr/api/contracts/setup";

vi.mock("next/headers");

const TEST_INPUT: ExecSetupInputSchema = {
  organizationName: "My Test Org",
  name: "Test User",
  email: "test@example.com",
  password: "securepass123",
};

describe("setup", () => {
  describe("setup.exec", () => {
    test("should create the admin account and organization", async () => {
      const [, pending] = await router.setup.status();
      expect(pending?.status).toBe("pending");

      const [error] = await router.setup.exec(TEST_INPUT);
      expect(error).toBeNull();

      const [, completed] = await router.setup.status();
      expect(completed?.status).toBe("completed");
    });

    test("should generate slug from org name with spaces and special chars", async () => {
      const [error] = await router.setup.exec({
        ...TEST_INPUT,
        organizationName: "Tom Fischer's Org & Co!",
      });

      const org = await dbClient.organizations.getOrganization();

      expect(error).toBeNull();
      expect(org?.slug).toBe("tom-fischers-org--co");
    });

    test("should return FORBIDDEN when setup is already completed", async () => {
      const [error1] = await router.setup.exec(TEST_INPUT);
      expect(error1).toBeNull();

      const [error2] = await router.setup.exec({ ...TEST_INPUT, email: "other@example.com" });
      expect(error2?.code).toBe("FORBIDDEN");
    });
  });
});
