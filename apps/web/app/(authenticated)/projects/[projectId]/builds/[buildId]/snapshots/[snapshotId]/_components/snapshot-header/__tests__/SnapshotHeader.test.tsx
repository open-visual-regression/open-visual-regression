import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { mocks } from "@ovr/mocks";

import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotHeader } from "../SnapshotHeader";

const snapshot: SnapshotSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  viewportName: "desktop",
  targetName: "Kitchen Sink",
  targetTitle: "UI/Button",
  imagePath: "new.png",
  status: "needs_review",
  errorLogs: [],
};

describe("SnapshotHeader", () => {
  it("should show the snapshot status badge", () => {
    const build = mocks.build.generateBuild();
    render(<SnapshotHeader snapshot={snapshot} build={build} />);

    expect(screen.getByText("needs review")).toBeVisible();
  });

  it("should show the error alert when the snapshot failed to capture", () => {
    const build = mocks.build.generateBuild();
    render(<SnapshotHeader snapshot={{ ...snapshot, status: "error" }} build={build} />);

    expect(screen.getByText("Error")).toBeVisible();
    expect(screen.getByText("This snapshot failed to capture.")).toBeVisible();
  });

  it("should not show the error alert when the snapshot did not fail to capture", () => {
    const build = mocks.build.generateBuild();
    render(<SnapshotHeader snapshot={{ ...snapshot, status: "unchanged" }} build={build} />);

    expect(screen.queryByText("Error")).not.toBeInTheDocument();
  });
});
