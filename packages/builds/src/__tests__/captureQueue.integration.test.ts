import { vi } from "vitest";

import { DEFAULT_CAPTURE_QUEUE_SETTINGS } from "@ovr/api/contracts/jobs";
import { dbClient } from "@ovr/db/client";

import { getCaptureQueue, getCaptureQueuePolicy, saveCaptureQueueSettings } from "../captureQueue";
import { describe, expect, test } from "./fixtures";

describe("captureQueue", () => {
  describe("getCaptureQueuePolicy", () => {
    test("should default to deadline when no policy has been saved or set", async () => {
      vi.stubEnv("OVR_CAPTURE_QUEUE_POLICY", "");

      expect(await getCaptureQueuePolicy()).toBe("deadline");
    });

    test("should use the policy an admin saved", async ({ user }) => {
      vi.stubEnv("OVR_CAPTURE_QUEUE_POLICY", "");
      await saveCaptureQueueSettings({ policy: "round-robin" }, user.id);

      expect(await getCaptureQueuePolicy()).toBe("round-robin");
    });

    test("should use OVR_CAPTURE_QUEUE_POLICY over the policy an admin saved", async ({ user }) => {
      vi.stubEnv("OVR_CAPTURE_QUEUE_POLICY", "fifo");
      await saveCaptureQueueSettings({ policy: "round-robin" }, user.id);

      expect(await getCaptureQueuePolicy()).toBe("fifo");
    });

    test("should ignore an unknown OVR_CAPTURE_QUEUE_POLICY", async ({ user }) => {
      vi.stubEnv("OVR_CAPTURE_QUEUE_POLICY", "lifo");
      await saveCaptureQueueSettings({ policy: "round-robin" }, user.id);

      expect(await getCaptureQueuePolicy()).toBe("round-robin");
    });

    test("should fall back to deadline when the saved policy is no longer known", async ({
      user,
    }) => {
      vi.stubEnv("OVR_CAPTURE_QUEUE_POLICY", "");
      await dbClient.jobSettings.upsert({
        job: "capture_queue",
        settings: { policy: "lifo" },
        updatedBy: user.id,
      });

      expect(await getCaptureQueuePolicy()).toBe("deadline");
    });
  });

  describe("getCaptureQueue", () => {
    test("should return the default settings and no env policy when neither is set", async () => {
      vi.stubEnv("OVR_CAPTURE_QUEUE_POLICY", "");

      expect(await getCaptureQueue()).toEqual({
        settings: DEFAULT_CAPTURE_QUEUE_SETTINGS,
        envPolicy: null,
      });
    });

    test("should return the saved settings alongside the env policy that overrides them", async ({
      user,
    }) => {
      vi.stubEnv("OVR_CAPTURE_QUEUE_POLICY", "fifo");
      await saveCaptureQueueSettings({ policy: "round-robin" }, user.id);

      expect(await getCaptureQueue()).toEqual({
        settings: { policy: "round-robin" },
        envPolicy: "fifo",
      });
    });
  });
});
