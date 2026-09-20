import { describe, expect, it } from "vitest";

import { decodeSnapshotsCursor, encodeSnapshotsCursor } from "../cursor";

const CURSOR = {
  statusPriority: 4,
  targetTitle: "Components/Button",
  targetName: "Primary",
  browser: "chromium",
  viewportWidth: 1280,
  id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
};

describe("decodeSnapshotsCursor", () => {
  it("should round-trip an encoded cursor", () => {
    expect(decodeSnapshotsCursor(encodeSnapshotsCursor(CURSOR))).toEqual(CURSOR);
  });

  it("should reject a token that is not encoded JSON", () => {
    expect(() => decodeSnapshotsCursor("not-a-cursor")).toThrow("Invalid --cursor value");
  });

  it("should reject a token encoding something other than a cursor", () => {
    const token = Buffer.from(JSON.stringify({ page: 2 })).toString("base64url");

    expect(() => decodeSnapshotsCursor(token)).toThrow("Invalid --cursor value");
  });
});
