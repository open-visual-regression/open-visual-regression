import { describe, expect, it } from "vitest";

import { parsePositiveInt } from "../env";

describe("parsePositiveInt", () => {
  it("should return the fallback when the value is undefined", () => {
    expect(parsePositiveInt(undefined, 5)).toBe(5);
  });

  it("should return the fallback when the value is not numeric", () => {
    expect(parsePositiveInt("garbage", 5)).toBe(5);
  });

  it("should return the fallback when the value is zero or negative", () => {
    expect(parsePositiveInt("0", 5)).toBe(5);
    expect(parsePositiveInt("-3", 5)).toBe(5);
  });

  it("should return the fallback when the value is not an integer", () => {
    expect(parsePositiveInt("3.5", 5)).toBe(5);
  });

  it("should return the parsed value when it is a valid positive integer", () => {
    expect(parsePositiveInt("10", 5)).toBe(10);
  });
});
