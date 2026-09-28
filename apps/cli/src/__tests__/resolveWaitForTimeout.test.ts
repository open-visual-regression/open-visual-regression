import { describe, expect, it } from "vitest";

import { resolveWaitForTimeout } from "../config";

describe("resolveWaitForTimeout", () => {
  it("should default to no wait when no config exists", () => {
    expect(resolveWaitForTimeout(undefined)).toBe(0);
  });

  it("should default to no wait when the config omits 'waitForTimeout'", () => {
    expect(resolveWaitForTimeout({ diffThreshold: 0.1 })).toBe(0);
  });

  it("should use the config's 'waitForTimeout' when set", () => {
    expect(resolveWaitForTimeout({ waitForTimeout: 1500 })).toBe(1500);
  });

  it.each([-1, 1.5, 30_001, Number.NaN])(
    "should throw a clear error when 'waitForTimeout' is %s",
    (waitForTimeout) => {
      expect(() => resolveWaitForTimeout({ waitForTimeout })).toThrow(/waitForTimeout/);
    },
  );
});
