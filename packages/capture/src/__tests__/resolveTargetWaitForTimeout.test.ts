import { describe, expect, it } from "vitest";

import { MAX_WAIT_FOR_TIMEOUT_MS } from "@ovr/storybook-compat/parameters";

import { resolveTargetWaitForTimeout } from "../storyViewports";

describe("resolveTargetWaitForTimeout", () => {
  it("should use the build default when the story has no override", () => {
    expect(resolveTargetWaitForTimeout(500, undefined)).toBe(500);
    expect(resolveTargetWaitForTimeout(500, { diffThreshold: 0.1 })).toBe(500);
  });

  it("should use the story's override, including 0 to opt out of the build default", () => {
    expect(resolveTargetWaitForTimeout(500, { waitForTimeout: 2000 })).toBe(2000);
    expect(resolveTargetWaitForTimeout(500, { waitForTimeout: 0 })).toBe(0);
  });

  it("should clamp an out-of-range override instead of failing the build", () => {
    expect(resolveTargetWaitForTimeout(0, { waitForTimeout: -100 })).toBe(0);
    expect(resolveTargetWaitForTimeout(0, { waitForTimeout: 999_999 })).toBe(
      MAX_WAIT_FOR_TIMEOUT_MS,
    );
    expect(resolveTargetWaitForTimeout(0, { waitForTimeout: 250.6 })).toBe(251);
  });

  it("should fall back to the build default when the override isn't a number", () => {
    const override = { waitForTimeout: "1000" as unknown as number };
    expect(resolveTargetWaitForTimeout(500, override)).toBe(500);
  });
});
