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
  isFlaky: false,
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

  it("should omit the flags and error lines when absent", () => {
    const output = formatSnapshotDetail(SNAPSHOT);

    expect(output).not.toContain("Flags");
    expect(output).not.toContain("Error:");
  });

  it("should derive flags from the deprecated booleans when the server sends no flags", () => {
    const output = formatSnapshotDetail({ ...SNAPSHOT, isFlaky: true, hasUncaughtPageError: true });

    expect(output).toContain("Flags:    flaky, warning");
    expect(output).not.toContain("Flags:\n");
  });

  it("should list each flag's details under a Flags section", () => {
    const output = formatSnapshotDetail({
      ...SNAPSHOT,
      flags: [
        {
          flag: "flaky",
          detection: {
            sampleCount: 13,
            changeCount: 12,
            revertCount: 0,
            sameCommitMismatchCount: 1,
          },
          matchesEarlierVariant: true,
        },
        { flag: "warning" },
      ],
    });

    expect(output).toContain("Flags:    flaky, warning");
    expect(output).toContain(
      "Flags:\n  flaky: screenshot changed 12 times across the last 13 builds; changed back to an earlier image 0 times; the same code produced different screenshots 1 time; matches how this snapshot looked in an earlier build\n  warning: the page threw an uncaught error",
    );
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
