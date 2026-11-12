import { describe, expect, it } from "vitest";

import { formatRebuildOutput } from "../rebuild";

const BUILD_ID = "01a092d6-b0aa-71bf-9312-dd8ef48a22fb";

describe("formatRebuildOutput", () => {
  it("should print the new build's id as JSON when json is true", () => {
    expect(JSON.parse(formatRebuildOutput(BUILD_ID, true))).toEqual({ buildId: BUILD_ID });
  });

  it("should say which build the rebuild became when json is false", () => {
    expect(formatRebuildOutput(BUILD_ID, false)).toBe(`Rebuilding as build ${BUILD_ID}`);
  });
});
