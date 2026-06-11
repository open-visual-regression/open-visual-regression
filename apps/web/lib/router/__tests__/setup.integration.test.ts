import { vi } from "vitest";

import { test, describe, expect } from "@/lib/testing/fixtures";
import { router } from "@/lib/router";

vi.mock("next/headers");

const TEST_INPUT = {
  organizationName: "My Test Org",
  name: "Test User",
  email: "test@example.com",
  password: "securepass123",
};

describe("setup", () => {
  describe("setup.status", () => {
    test("should return pending when DB is empty", async () => {
      const [error, result] = await router.setup.status();
      expect(error).toBeNull();
      expect(result?.status).toBe("pending");
    });

    test("should return completed when both users and orgs exist", async () => {
      await router.setup.exec(TEST_INPUT);

      const [error, result] = await router.setup.status();
      expect(error).toBeNull();
      expect(result?.status).toBe("completed");
    });
  });

  describe("setup.exec", () => {
    test("should create the admin account and organization", async () => {
      const [error] = await router.setup.exec(TEST_INPUT);
      expect(error).toBeNull();

      const [, statusResult] = await router.setup.status();
      expect(statusResult?.status).toBe("completed");
    });

    test("should generate slug from org name with spaces and special chars", async () => {
      const [error] = await router.setup.exec({
        ...TEST_INPUT,
        organizationName: "Tom Fischer's Org & Co!",
      });
      expect(error).toBeNull();
    });
  });
});
