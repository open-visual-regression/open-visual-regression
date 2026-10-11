import { describe, expect, it } from "vitest";

import { getCaptureViewport } from "../page";

describe("getCaptureViewport", () => {
  it("should use the viewport's own height for a fixed-height capture", () => {
    expect(getCaptureViewport(1280, 720)).toEqual({ width: 1280, height: 720, fullPage: false });
  });

  it("should capture the full page from a default height when the height is 0", () => {
    expect(getCaptureViewport(375, 0)).toEqual({ width: 375, height: 800, fullPage: true });
  });
});
