import { describe, expect, it } from "vitest";

import { MAX_LIMIT, parseEnumOption, parseLimit } from "../filters";

const STATUSES = ["needs_review", "unchanged"] as const;

describe("parseEnumOption", () => {
  it("should return undefined when the flag was not passed", () => {
    expect(parseEnumOption("--status", undefined, STATUSES)).toBeUndefined();
  });

  it("should return every value when they are all allowed", () => {
    expect(parseEnumOption("--status", ["needs_review", "unchanged"], STATUSES)).toEqual([
      "needs_review",
      "unchanged",
    ]);
  });

  it("should name the offending value and list the valid ones", () => {
    expect(() => parseEnumOption("--status", ["need_review"], STATUSES)).toThrow(
      "Invalid --status value(s): need_review. Valid values: needs_review, unchanged",
    );
  });
});

describe("parseLimit", () => {
  it("should accept a limit inside the range the API allows", () => {
    expect(parseLimit("24")).toBe(24);
  });

  it("should reject a limit above the API's maximum", () => {
    expect(() => parseLimit(String(MAX_LIMIT + 1))).toThrow(
      `--limit must be an integer between 1 and ${MAX_LIMIT}.`,
    );
  });

  it("should reject a limit below one", () => {
    expect(() => parseLimit("0")).toThrow("--limit must be an integer between 1 and");
  });

  it("should reject a limit that is not a whole number", () => {
    expect(() => parseLimit("1.5")).toThrow("--limit must be an integer between 1 and");
  });

  it("should reject a limit that is not a number", () => {
    expect(() => parseLimit("many")).toThrow("--limit must be an integer between 1 and");
  });
});
