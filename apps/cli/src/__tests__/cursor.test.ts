import { describe, expect, it } from "vitest";

import { decodeBuildsCursor, encodeBuildsCursor } from "../cursor";

const CURSOR = { createdAt: "2026-09-12T10:43:15Z", id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb" };

describe("encodeBuildsCursor", () => {
  it("should produce a token safe to pass back on the command line", () => {
    expect(encodeBuildsCursor(CURSOR)).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("decodeBuildsCursor", () => {
  it("should round-trip an encoded cursor", () => {
    expect(decodeBuildsCursor(encodeBuildsCursor(CURSOR))).toEqual(CURSOR);
  });

  it("should reject a token that is not encoded JSON", () => {
    expect(() => decodeBuildsCursor("not-a-cursor")).toThrow("Invalid --cursor value");
  });

  it("should reject a token encoding something other than a cursor", () => {
    const token = Buffer.from(JSON.stringify({ page: 2 })).toString("base64url");

    expect(() => decodeBuildsCursor(token)).toThrow("Invalid --cursor value");
  });
});
