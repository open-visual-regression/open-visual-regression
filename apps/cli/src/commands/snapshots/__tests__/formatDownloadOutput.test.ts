import { describe, expect, it } from "vitest";

import { formatDownloadOutput, type DownloadedImages } from "../images";

describe("formatDownloadOutput", () => {
  const WRITTEN: DownloadedImages = {
    current: "/out/current.png",
    baseline: "/out/baseline.png",
    diff: "/out/diff.png",
  };

  it("should print the written paths as JSON when json is true", () => {
    expect(formatDownloadOutput(WRITTEN, true)).toBe(JSON.stringify(WRITTEN, null, 2));
  });

  it("should print a line per written image", () => {
    expect(formatDownloadOutput(WRITTEN, false)).toBe(
      "Wrote /out/current.png\nWrote /out/baseline.png\nWrote /out/diff.png",
    );
  });

  it("should name the images the snapshot did not have", () => {
    expect(
      formatDownloadOutput({ current: "/out/current.png", baseline: null, diff: null }, false),
    ).toBe("Wrote /out/current.png\nNo baseline or diff image for this snapshot.");
  });

  it("should report when the snapshot had no images at all", () => {
    expect(formatDownloadOutput({ current: null, baseline: null, diff: null }, false)).toBe(
      "No images to download for this snapshot.",
    );
  });
});
