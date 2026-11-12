import { vi } from "vitest";

import { db } from "@ovr/db/db";

import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");

describe("health", () => {
  describe("health.live", () => {
    test("should return ok without querying the database", async () => {
      const executeSpy = vi.spyOn(db, "execute");

      const [error, data] = await serverClient.health.live();

      expect(error).toBeNull();
      expect(data).toEqual({ status: "ok" });
      expect(executeSpy).not.toHaveBeenCalled();
    });

    test("should return ok when the database is unreachable", async () => {
      vi.spyOn(db, "execute").mockRejectedValue(new Error("simulated db failure"));

      const [error, data] = await serverClient.health.live();

      expect(error).toBeNull();
      expect(data).toEqual({ status: "ok" });
    });
  });

  describe("health.ready", () => {
    test("should return ok when redis is reachable", async () => {
      const [error, data] = await serverClient.health.ready();

      expect(error).toBeNull();
      expect(data).toEqual({ status: "ok", checks: { redis: "ok" } });
    });

    test("should return ok when the database is unreachable", async () => {
      vi.spyOn(db, "execute").mockRejectedValue(new Error("simulated db failure"));

      const [error, data] = await serverClient.health.ready();

      expect(error).toBeNull();
      expect(data).toEqual({ status: "ok", checks: { redis: "ok" } });
    });

    test("should return a degraded status when redis is unreachable", async () => {
      vi.stubEnv("REDIS_URL", "redis://127.0.0.1:1");

      const [error, data] = await serverClient.health.ready();

      expect(error).toBeNull();
      expect(data).toEqual({ status: "degraded", checks: { redis: "error" } });
    });
  });
});
