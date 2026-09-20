import { describe, expect, it } from "vitest";

import { parseThreshold } from "../filters";

describe("parseThreshold", () => {
  it("should accept a fraction inside the range the config allows", () => {
    expect(parseThreshold("0.05")).toBe(0.05);
  });

  it("should accept the maximum of one", () => {
    expect(parseThreshold("1")).toBe(1);
  });

  it("should reject zero", () => {
    expect(() => parseThreshold("0")).toThrow("--threshold must be greater than 0 and at most 1.");
  });

  it("should reject a fraction above one", () => {
    expect(() => parseThreshold("1.5")).toThrow(
      "--threshold must be greater than 0 and at most 1.",
    );
  });

  it("should reject a value that is not a number", () => {
    expect(() => parseThreshold("loose")).toThrow(
      "--threshold must be greater than 0 and at most 1.",
    );
  });
});
