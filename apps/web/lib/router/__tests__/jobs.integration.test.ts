import { vi } from "vitest";

import {
  DEFAULT_FLAKY_DETECTION_SETTINGS,
  type FlakyDetectionSettings,
} from "@ovr/api/contracts/jobs";
import { QueueUnavailableError } from "@ovr/queue";
import { enqueueFlakySnapshotDispatch, scheduleJob } from "@ovr/queue/producer";

import { serverClient } from "@/lib/router";
import { test, describe, expect } from "@/lib/testing/fixtures";

vi.mock("next/headers");
vi.mock("@ovr/queue/producer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ovr/queue/producer")>();
  return {
    ...actual,
    scheduleJob: vi.fn<typeof actual.scheduleJob>(actual.scheduleJob),
    enqueueFlakySnapshotDispatch: vi.fn<typeof actual.enqueueFlakySnapshotDispatch>(),
  };
});

const SETTINGS: FlakyDetectionSettings = {
  enabled: true,
  cron: "0 */6 * * *",
  windowBuilds: 50,
};

describe("jobs", () => {
  describe("getFlakyDetection", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.jobs.getFlakyDetection();
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.jobs.getFlakyDetection();
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return the default settings when none have been saved", async ({ admin: _ }) => {
      const [error, result] = await serverClient.jobs.getFlakyDetection();

      expect(error).toBeNull();
      expect(result?.settings).toEqual(DEFAULT_FLAKY_DETECTION_SETTINGS);
    });

    test("should report that the job has never run and is not running", async ({ admin: _ }) => {
      const [, result] = await serverClient.jobs.getFlakyDetection();

      expect(result?.lastRunAt).toBeNull();
      expect(result?.running).toBe(false);
    });
  });

  describe("updateFlakyDetection", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.jobs.updateFlakyDetection(SETTINGS);
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.jobs.updateFlakyDetection(SETTINGS);
      expect(error?.code).toBe("FORBIDDEN");
    });

    test.for<[string, Partial<FlakyDetectionSettings>]>([
      ["the schedule is not a cron pattern", { cron: "hourly" }],
      ["the window is not a whole number of builds", { windowBuilds: 2.5 }],
      ["the window is empty", { windowBuilds: 0 }],
    ])("should return BAD_REQUEST when %s", async ([, invalid], { admin: _ }) => {
      const [error] = await serverClient.jobs.updateFlakyDetection({ ...SETTINGS, ...invalid });
      expect(error?.code).toBe("BAD_REQUEST");
    });

    test("should save the settings so they are returned afterwards", async ({ admin: _ }) => {
      const [error] = await serverClient.jobs.updateFlakyDetection(SETTINGS);

      expect(error).toBeNull();

      const [, result] = await serverClient.jobs.getFlakyDetection();
      expect(result?.settings).toEqual(SETTINGS);
    });

    test("should schedule the dispatch on the saved cron pattern when detection is enabled", async ({
      admin: _,
    }) => {
      await serverClient.jobs.updateFlakyDetection(SETTINGS);

      expect(scheduleJob).toHaveBeenLastCalledWith("flaky_detection", "0 */6 * * *");
    });

    test("should stop scheduling the dispatch when detection is disabled", async ({ admin: _ }) => {
      await serverClient.jobs.updateFlakyDetection({ ...SETTINGS, enabled: false });

      expect(scheduleJob).toHaveBeenLastCalledWith("flaky_detection", null);
    });

    test("should keep the saved settings and return SERVICE_UNAVAILABLE when the queue is unavailable", async ({
      admin: _,
    }) => {
      vi.mocked(scheduleJob).mockRejectedValueOnce(new QueueUnavailableError());

      const [error] = await serverClient.jobs.updateFlakyDetection(SETTINGS);

      expect(error?.code).toBe("SERVICE_UNAVAILABLE");
      const [, result] = await serverClient.jobs.getFlakyDetection();
      expect(result?.settings).toEqual(SETTINGS);
    });
  });

  describe("runFlakyDetection", () => {
    test("should return UNAUTHORIZED when no session cookie is provided", async () => {
      const [error] = await serverClient.jobs.runFlakyDetection();
      expect(error?.code).toBe("UNAUTHORIZED");
    });

    test("should return FORBIDDEN when the session user is not an admin", async ({
      reviewer: _,
    }) => {
      const [error] = await serverClient.jobs.runFlakyDetection();
      expect(error?.code).toBe("FORBIDDEN");
    });

    test("should return PRECONDITION_FAILED and not queue anything when detection is disabled", async ({
      admin: _,
    }) => {
      const [error] = await serverClient.jobs.runFlakyDetection();

      expect(error?.code).toBe("PRECONDITION_FAILED");
      expect(enqueueFlakySnapshotDispatch).not.toHaveBeenCalled();
    });

    test("should queue a dispatch when detection is enabled", async ({ admin: _ }) => {
      await serverClient.jobs.updateFlakyDetection(SETTINGS);

      const [error] = await serverClient.jobs.runFlakyDetection();

      expect(error).toBeNull();
      expect(enqueueFlakySnapshotDispatch).toHaveBeenCalledOnce();
    });

    test("should return SERVICE_UNAVAILABLE when the queue is unavailable", async ({
      admin: _,
    }) => {
      await serverClient.jobs.updateFlakyDetection(SETTINGS);
      vi.mocked(enqueueFlakySnapshotDispatch).mockRejectedValueOnce(new QueueUnavailableError());

      const [error] = await serverClient.jobs.runFlakyDetection();

      expect(error?.code).toBe("SERVICE_UNAVAILABLE");
    });
  });
});
