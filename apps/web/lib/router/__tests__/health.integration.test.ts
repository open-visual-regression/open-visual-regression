import { vi } from "vitest";

import { db } from "@ovr/db/db";

import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

describe("health", () => {
  describe("health.live", () => {
    test("should return ok without touching any dependency", async () => {
      const executeSpy = vi.spyOn(db, "execute");

      const [error, data] = await serverClient.health.live();

      expect(error).toBeNull();
      expect(data).toEqual({ status: "ok" });
      expect(executeSpy).not.toHaveBeenCalled();
    });
  });

  describe("health.ready", () => {
    test("should return ok when the db and redis are reachable", async () => {
      const [error, data] = await serverClient.health.ready();

      expect(error).toBeNull();
      expect(data).toEqual({ status: "ok", checks: { db: "ok", redis: "ok" } });
    });

    test("should return a 503 SERVICE_UNAVAILABLE error when the db is unreachable", async () => {
      vi.spyOn(db, "execute").mockRejectedValueOnce(new Error("simulated db failure"));

      const [error, data] = await serverClient.health.ready();

      expect(data).toBeUndefined();
      expect(error?.code).toBe("SERVICE_UNAVAILABLE");
      expect(error?.status).toBe(503);
      expect(error?.data).toEqual({ checks: { db: "error", redis: "ok" } });
    });

    test("should stay ready but report degraded when only redis is unreachable", async () => {
      vi.stubEnv("REDIS_URL", "redis://127.0.0.1:1");

      const [error, data] = await serverClient.health.ready();

      expect(error).toBeNull();
      expect(data).toEqual({ status: "degraded", checks: { db: "ok", redis: "error" } });
    });
  });
});
