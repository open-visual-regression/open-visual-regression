import { vi } from "vitest";

import { serverClient } from "@/lib/router";
import { describe, expect, test } from "@/lib/testing/fixtures";

vi.mock("next/headers");

describe("githubApp", () => {
  describe("status", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.githubApp.status();
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.githubApp.status();
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should report that no app is configured", async ({ admin: _ }) => {
      vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "");
      vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", "");

      const [error, result] = await serverClient.githubApp.status();
      expect(error).toBeNull();
      expect(result).toEqual({ status: "not_configured" });
    });
  });
});
