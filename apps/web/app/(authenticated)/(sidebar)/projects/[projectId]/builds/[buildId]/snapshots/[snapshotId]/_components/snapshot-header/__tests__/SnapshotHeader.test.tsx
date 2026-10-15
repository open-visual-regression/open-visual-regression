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
  errorMessage: null,
  hasUncaughtPageError: false,
  isFlaky: false,
  flags: [],
  isRebuildable: false,
  isReviewable: true,
  errorLogs: [],
  queuedMs: 12_000,
  processingMs: 3_400,
};

describe("SnapshotHeader", () => {
  it("should show the snapshot status badge", () => {
    const build = mocks.build.generateBuild();
    render(<SnapshotHeader snapshot={snapshot} build={build} storybookHref={null} />);

    expect(screen.getByText("needs review")).toBeVisible();
  });

  it("should show a flaky badge when the story has been flagged", () => {
    const build = mocks.build.generateBuild();
    render(
      <SnapshotHeader
        snapshot={{ ...snapshot, isFlaky: true }}
        build={build}
        storybookHref={null}
      />,
    );

    expect(screen.getByText("flaky")).toBeVisible();
  });

  it("should not show a flaky badge when the story has not been flagged", () => {
    const build = mocks.build.generateBuild();
    render(<SnapshotHeader snapshot={snapshot} build={build} storybookHref={null} />);

    expect(screen.queryByText("flaky")).not.toBeInTheDocument();
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

  it("should show the specific render error message when one was captured", () => {
    const build = mocks.build.generateBuild();
    render(
      <SnapshotHeader
        snapshot={{
          ...snapshot,
          status: "error",
          errorMessage: "Cannot read properties of undefined (reading 'items')",
        }}
        build={build}
        storybookHref={null}
      />,
    );

    expect(screen.getByText("Error")).toBeVisible();
    expect(screen.getByText("Cannot read properties of undefined (reading 'items')")).toBeVisible();
  });

  it("should show a warning when an uncaught page error occurred but the snapshot still captured", () => {
    const build = mocks.build.generateBuild();
    render(
      <SnapshotHeader
        snapshot={{ ...snapshot, status: "unchanged", hasUncaughtPageError: true }}
        build={build}
        storybookHref={null}
      />,
    );

    expect(screen.getByText("Warning")).toBeVisible();
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

  it("should show how long the snapshot took to process", () => {
    const build = mocks.build.generateBuild();
    render(<SnapshotHeader snapshot={snapshot} build={build} storybookHref={null} />);

    expect(screen.getByRole("img", { name: "processing time" })).toBeVisible();
    expect(screen.getByText("3.4s")).toBeVisible();
  });

  it("should not show how long the snapshot was queued", () => {
    const build = mocks.build.generateBuild();
    render(<SnapshotHeader snapshot={snapshot} build={build} storybookHref={null} />);

    expect(screen.queryByText(/queued \d/)).not.toBeInTheDocument();
  });

  it("should not show the processing time while the snapshot is still processing", () => {
    const build = mocks.build.generateBuild();
    render(
      <SnapshotHeader
        snapshot={{ ...snapshot, status: "processing", processingMs: null }}
        build={build}
        storybookHref={null}
      />,
    );

    expect(screen.queryByRole("img", { name: "processing time" })).not.toBeInTheDocument();
  });
});
