import { describe, expect, it } from "vitest";

import { formatSnapshotDetail } from "../detail";

const SNAPSHOT = {
  id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
  status: "needs_review",
  targetTitle: "Components/Button",
  targetName: "Primary",
  browser: "chromium",
  viewportName: "desktop",
  viewportWidth: 1280,
  viewportHeight: 800,
  imagePath: "project/builds/build/snapshots/snap.png",
  hasUncaughtPageError: false,
  errorMessage: null,
  errorLogs: [],
};

describe("formatSnapshotDetail", () => {
  it("should render the core fields as label: value lines", () => {
    const output = formatSnapshotDetail(SNAPSHOT);
    const lines = output.split("\n");

    expect(lines).toEqual([
      "Snapshot: 01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
      "Status:   needs_review",
      "Story:    Components/Button / Primary",
      "Browser:  chromium",
      "Viewport: desktop 1280x800",
      "Image:    project/builds/build/snapshots/snap.png",
    ]);
  });

  it("should omit the uncaught-error and error lines when absent", () => {
    const output = formatSnapshotDetail(SNAPSHOT);

    expect(output).not.toContain("Uncaught error:");
    expect(output).not.toContain("Error:");
  });

  it("should flag an uncaught page error when present", () => {
    const output = formatSnapshotDetail({ ...SNAPSHOT, hasUncaughtPageError: true });

    expect(output).toContain("Uncaught error: yes");
  });

  it("should include the error message when present", () => {
    const output = formatSnapshotDetail({
      ...SNAPSHOT,
      errorMessage: "story threw during render",
    });

    expect(output).toContain("Error:    story threw during render");
  });

  it("should omit the logs section when there are no logs", () => {
    expect(formatSnapshotDetail(SNAPSHOT)).not.toContain("Logs:");
  });

  it("should list each log line under a Logs section", () => {
    const output = formatSnapshotDetail({
      ...SNAPSHOT,
      errorLogs: [
        { id: "log-1", level: "error", message: "story threw", timestamp: "2026-09-12T10:43:15Z" },
        { id: "log-2", level: "warn", message: "slow render", timestamp: "2026-09-12T10:43:16Z" },
      ],
    });

    expect(output).toContain(
      "Logs:\n  [error] story threw (2026-09-12T10:43:15Z)\n  [warn] slow render (2026-09-12T10:43:16Z)",
    );
  });
});
