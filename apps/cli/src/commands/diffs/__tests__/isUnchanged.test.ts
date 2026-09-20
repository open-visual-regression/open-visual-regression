import { describe, expect, it } from "vitest";

import { isUnchanged } from "../comparison";

describe("isUnchanged", () => {
  it("should treat identical images as unchanged", () => {
    expect(isUnchanged(0, 0.05)).toBe(true);
  });

  it("should treat a difference within the threshold as unchanged", () => {
    expect(isUnchanged(0.04, 0.05)).toBe(true);
  });

  it("should treat a difference exactly at the threshold as unchanged", () => {
    expect(isUnchanged(0.05, 0.05)).toBe(true);
  });

  it("should treat a difference beyond the threshold as needing review", () => {
    expect(isUnchanged(0.06, 0.05)).toBe(false);
  });

  it("should compare the percentage against the threshold directly, as the server does", () => {
    expect(isUnchanged(1, 0.05)).toBe(false);
  });
});
