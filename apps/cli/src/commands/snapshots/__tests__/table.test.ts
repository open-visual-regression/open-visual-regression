import { describe, expect, it } from "vitest";

import { formatSnapshotsTable } from "../table";

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
