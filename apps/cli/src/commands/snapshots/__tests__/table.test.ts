import { describe, expect, it } from "vitest";

import { formatDiffPercent, formatSnapshotsTable, formatStory, formatViewport } from "../table";

describe("formatStory", () => {
  it("should join the story's title and name", () => {
    expect(formatStory({ targetTitle: "Components/Button", targetName: "Primary" })).toBe(
      "Components/Button / Primary",
    );
  });
});

describe("formatViewport", () => {
  it("should print the viewport name with its dimensions", () => {
    expect(
      formatViewport({ viewportName: "desktop", viewportWidth: 1280, viewportHeight: 800 }),
    ).toBe("desktop 1280x800");
  });

  it("should report a full page capture when there is no fixed height", () => {
    expect(
      formatViewport({ viewportName: "mobile", viewportWidth: 375, viewportHeight: null }),
    ).toBe("mobile 375xfull");
  });
});

describe("formatDiffPercent", () => {
  it("should print a dash when the snapshot was not diffed", () => {
    expect(formatDiffPercent(null)).toBe("-");
  });

  it("should print two decimal places", () => {
    expect(formatDiffPercent(1.2345)).toBe("1.23");
  });

  it("should distinguish a snapshot diffed with no differences from one not diffed", () => {
    expect(formatDiffPercent(0)).toBe("0.00");
  });
});

describe("formatSnapshotsTable", () => {
  it("should render a header row and one row per snapshot", () => {
    const table = formatSnapshotsTable([
      {
        id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
        status: "needs_review",
        story: "Components/Button / Primary",
        browser: "chromium",
        viewport: "desktop 1280x800",
        diffPercent: "1.23",
      },
    ]);
    const lines = table.split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("SNAPSHOT");
    expect(lines[0]).toContain("DIFF%");
    expect(lines[1]).toContain("Components/Button / Primary");
    expect(lines[1]).toContain("1.23");
  });
});
