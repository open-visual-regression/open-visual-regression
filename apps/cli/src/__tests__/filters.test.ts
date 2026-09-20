import { describe, expect, it } from "vitest";

import { parseEnumOption } from "../filters";

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
