import { describe, expect, it } from "vitest";

import { listBuildsInputSchema } from "@ovr/api/contracts/builds";
import { getHistoryInputSchema, MAX_SNAPSHOT_HISTORY } from "@ovr/api/contracts/snapshots";

import { getMaxLimit, parseLimit } from "../filters";

const schema = listBuildsInputSchema.shape.limit;
const max = getMaxLimit(schema);

describe("parseLimit", () => {
  it("should accept a limit inside the range the API allows", () => {
    expect(parseLimit("24", schema)).toBe(24);
  });

  it("should reject a limit above the API's maximum", () => {
    expect(() => parseLimit(String(max + 1), schema)).toThrow(
      `--limit must be an integer between 1 and ${max}.`,
    );
  });

  it("should reject a limit below one", () => {
    expect(() => parseLimit("0", schema)).toThrow("--limit must be an integer between 1 and");
  });

  it("should reject a limit that is not a whole number", () => {
    expect(() => parseLimit("1.5", schema)).toThrow("--limit must be an integer between 1 and");
  });

  it("should reject a limit that is not a number", () => {
    expect(() => parseLimit("many", schema)).toThrow("--limit must be an integer between 1 and");
  });
});

describe("getMaxLimit", () => {
  it("should read the maximum from the command's own limit schema", () => {
    expect(getMaxLimit(getHistoryInputSchema.shape.limit)).toBe(MAX_SNAPSHOT_HISTORY);
  });
});
