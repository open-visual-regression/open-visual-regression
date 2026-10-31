import { describe, expect, it } from "vitest";

import { resolveTargetScreenshotStability } from "../storyViewports";

describe("resolveTargetScreenshotStability", () => {
  it("should use the build default when the story has no override", () => {
    expect(resolveTargetScreenshotStability("auto", undefined)).toBe("auto");
    expect(resolveTargetScreenshotStability("always", { diffThreshold: 0.1 })).toBe("always");
  });

  it("should use the story's override", () => {
    expect(resolveTargetScreenshotStability("auto", { screenshotStability: "off" })).toBe("off");
  });

  it("should fall back to the build default when the override isn't a known value", () => {
    const override = { screenshotStability: "sometimes" as "auto" };
    expect(resolveTargetScreenshotStability("auto", override)).toBe("auto");
  });
});
