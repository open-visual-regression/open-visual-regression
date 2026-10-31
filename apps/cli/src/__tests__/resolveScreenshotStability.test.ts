import { describe, expect, it } from "vitest";

import { resolveScreenshotStability } from "../config";

describe("resolveScreenshotStability", () => {
  it("should default to 'auto' when no config exists", () => {
    expect(resolveScreenshotStability(undefined)).toBe("auto");
  });

  it("should default to 'auto' when the config omits 'screenshotStability'", () => {
    expect(resolveScreenshotStability({ diffThreshold: 0.1 })).toBe("auto");
  });

  it("should use the config's 'screenshotStability' when set", () => {
    expect(resolveScreenshotStability({ screenshotStability: "off" })).toBe("off");
  });

  it("should throw a clear error for an unknown value", () => {
    const config = { screenshotStability: "sometimes" as "auto" };
    expect(() => resolveScreenshotStability(config)).toThrow(/screenshotStability/);
  });
});
