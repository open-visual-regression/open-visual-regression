import { describe, expect, test } from "vitest";

import {
  DEFAULT_FLAKY_DETECTION_SETTINGS,
  cronPatternSchema,
  storedFlakyDetectionSettingsSchema,
} from "../contracts/jobs";

describe("jobs", () => {
  describe("cronPatternSchema", () => {
    test.each(["17 * * * *", "0 */6 * * *", "0 3 * * 1-5"])("should accept %s", (pattern) => {
      expect(cronPatternSchema.safeParse(pattern).success).toBe(true);
    });

    test.each(["hourly", "61 * * * *", "* * * *  * * *"])("should reject %s", (pattern) => {
      expect(cronPatternSchema.safeParse(pattern).success).toBe(false);
    });
  });

  describe("storedFlakyDetectionSettingsSchema", () => {
    test("should use the defaults when nothing has been stored", () => {
      expect(storedFlakyDetectionSettingsSchema.parse(undefined)).toEqual(
        DEFAULT_FLAKY_DETECTION_SETTINGS,
      );
    });

    test("should keep valid stored values and fall back to the default for each invalid one", () => {
      expect(
        storedFlakyDetectionSettingsSchema.parse({
          enabled: true,
          cron: "hourly",
          windowBuilds: 50,
          minReverts: 0,
          minChangeRate: 0.6,
        }),
      ).toEqual({
        enabled: true,
        cron: DEFAULT_FLAKY_DETECTION_SETTINGS.cron,
        windowBuilds: 50,
        minReverts: DEFAULT_FLAKY_DETECTION_SETTINGS.minReverts,
        minSamples: DEFAULT_FLAKY_DETECTION_SETTINGS.minSamples,
        minChangeRate: 0.6,
      });
    });
  });
});
