import { mocks } from "@ovr/mocks";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { describe, expect, it, render, screen } from "@/test-utils";
import { SnapshotHeader } from "../SnapshotHeader";

const snapshot: SnapshotSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  targetName: "Kitchen Sink",
  targetTitle: "UI/Button",
  imagePath: null,
  errorLogs: [],
};

describe("SnapshotHeader", () => {
  it("should render the target, build name, browser, and viewport", () => {
    const build = mocks.build.generateBuild({ name: "Add new button variant" });
    render(<SnapshotHeader snapshot={snapshot} build={build} />);

    expect(screen.getByRole("heading", { name: "UI/Button Kitchen Sink" })).toBeVisible();
    expect(screen.getByText("Add new button variant")).toBeVisible();
    expect(screen.getByText(/chromium/)).toBeVisible();
    expect(screen.getByText(/1280×800/)).toBeVisible();
  });

  it("should fall back to auto height when the viewport has no fixed height", () => {
    const build = mocks.build.generateBuild();
    render(<SnapshotHeader snapshot={{ ...snapshot, viewportHeight: null }} build={build} />);

    expect(screen.getByText(/1280×auto/)).toBeVisible();
  });
});
