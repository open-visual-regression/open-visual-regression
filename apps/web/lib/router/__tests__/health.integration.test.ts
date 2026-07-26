import { vi } from "vitest";

import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

describe("health", () => {
  describe("health.check", () => {
    test("should return ok when the db and redis are reachable", async () => {
      const [error, data] = await serverClient.health.check();

      expect(error).toBeNull();
      expect(data).toEqual({ status: "ok", checks: { db: "ok", redis: "ok" } });
    });

    test("should return a 503 SERVICE_UNAVAILABLE error when redis is unreachable", async () => {
      const originalRedisUrl = process.env.REDIS_URL;
      process.env.REDIS_URL = "redis://127.0.0.1:1";

      try {
        const [error, data] = await serverClient.health.check();

        expect(data).toBeUndefined();
        expect(error?.code).toBe("SERVICE_UNAVAILABLE");
        expect(error?.status).toBe(503);
        expect(error?.data).toEqual({ checks: { db: "ok", redis: "error" } });
      } finally {
        process.env.REDIS_URL = originalRedisUrl;
      }
    });
  });
});
