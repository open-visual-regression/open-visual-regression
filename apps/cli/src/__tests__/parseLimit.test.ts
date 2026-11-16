import { describe, expect, it } from "vitest";

import { listBuildsInputSchema } from "@ovr/api/contracts/builds";
import { getHistoryInputSchema, MAX_SNAPSHOT_HISTORY } from "@ovr/api/contracts/snapshots";

import { parseLimit } from "../filters";

describe("parseLimit", () => {
  it("should accept a limit inside the range the API allows", () => {
    expect(parseLimit("24", listBuildsInputSchema.shape.limit)).toBe(24);
  });

  it("should reject a limit above the API's maximum", () => {
    expect(() => parseLimit("101", listBuildsInputSchema.shape.limit)).toThrow(
      "--limit must be an integer between 1 and 100.",
    );
  });

  it("should take the maximum from the command's own limit", () => {
    expect(() =>
      parseLimit(String(MAX_SNAPSHOT_HISTORY + 1), getHistoryInputSchema.shape.limit),
    ).toThrow(`--limit must be an integer between 1 and ${MAX_SNAPSHOT_HISTORY}.`);
  });

  it("should reject a limit below one", () => {
    expect(() => parseLimit("0", listBuildsInputSchema.shape.limit)).toThrow(
      "--limit must be an integer between 1 and",
    );
  });

  it("should reject a limit that is not a whole number", () => {
    expect(() => parseLimit("1.5", listBuildsInputSchema.shape.limit)).toThrow(
      "--limit must be an integer between 1 and",
    );
  });

  it("should reject a limit that is not a number", () => {
    expect(() => parseLimit("many", listBuildsInputSchema.shape.limit)).toThrow(
      "--limit must be an integer between 1 and",
    );
  });
});
