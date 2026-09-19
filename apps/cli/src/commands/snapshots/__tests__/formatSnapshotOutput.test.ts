import { describe, expect, it } from "vitest";

import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";

import { formatSnapshotOutput } from "../detail";

const SNAPSHOT: SnapshotSchema = {
  id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  viewportName: "desktop",
  targetId: "components-button--primary",
  targetName: "Primary",
  targetTitle: "Components/Button",
  imagePath: "project/builds/build/snapshots/snap.png",
  status: "needs_review",
  hasUncaughtPageError: false,
  errorMessage: null,
  errorLogs: [],
};

describe("formatSnapshotOutput", () => {
  it("should print the raw snapshot as JSON when json is true", () => {
    expect(formatSnapshotOutput(SNAPSHOT, true)).toBe(JSON.stringify(SNAPSHOT, null, 2));
  });

  it("should print formatted detail text, including its logs, when json is false", () => {
    const snapshot: SnapshotSchema = {
      ...SNAPSHOT,
      hasUncaughtPageError: true,
      errorMessage: "story threw during render",
      errorLogs: [
        { id: "log-1", level: "error", message: "story threw", timestamp: "2026-09-12T10:43:15Z" },
      ],
    };

    const output = formatSnapshotOutput(snapshot, false);

    expect(output).toContain(snapshot.id);
    expect(output).toContain("Components/Button / Primary");
    expect(output).toContain("Uncaught error: yes");
    expect(output).toContain("story threw during render");
    expect(output).toContain("[error] story threw (2026-09-12T10:43:15Z)");
  });
});
