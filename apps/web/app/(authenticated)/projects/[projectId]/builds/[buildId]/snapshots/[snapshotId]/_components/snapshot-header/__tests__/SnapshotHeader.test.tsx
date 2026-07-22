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
  targetId: "ui-button--primary",
  targetName: "Kitchen Sink",
  targetTitle: "UI/Button",
  imagePath: "new.png",
  status: "needs_review",
  errorLogs: [],
};

describe("SnapshotHeader", () => {
  it("should show the snapshot status badge", () => {
    const build = mocks.build.generateBuild();
    render(<SnapshotHeader snapshot={snapshot} build={build} storybookHref={null} />);

    expect(screen.getByText("needs review")).toBeVisible();
  });

  it("should show the error alert when the snapshot failed to capture", () => {
    const build = mocks.build.generateBuild();
    render(
      <SnapshotHeader
        snapshot={{ ...snapshot, status: "error" }}
        build={build}
        storybookHref={null}
      />,
    );

    expect(screen.getByText("Error")).toBeVisible();
    expect(screen.getByText("This snapshot failed to capture.")).toBeVisible();
  });

  it("should not show the error alert when the snapshot did not fail to capture", () => {
    const build = mocks.build.generateBuild();
    render(
      <SnapshotHeader
        snapshot={{ ...snapshot, status: "unchanged" }}
        build={build}
        storybookHref={null}
      />,
    );

    expect(screen.queryByText("Error")).not.toBeInTheDocument();
  });

  it("should render the view story link when the story is hosted", () => {
    const build = mocks.build.generateBuild();
    render(
      <SnapshotHeader
        snapshot={snapshot}
        build={build}
        storybookHref="/api/storybook/mock-build/index.html?path=/story/ui-button--primary"
      />,
    );

    expect(screen.getByRole("link", { name: /view story/i })).toBeVisible();
  });

  it("should not render the view story link when the story is not hosted", () => {
    const build = mocks.build.generateBuild();
    render(<SnapshotHeader snapshot={snapshot} build={build} storybookHref={null} />);

    expect(screen.queryByRole("link", { name: /view story/i })).not.toBeInTheDocument();
  });
});
