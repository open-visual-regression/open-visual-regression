import { mocks } from "@ovr/mocks";

import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotCard } from "../SnapshotCard";

describe("SnapshotCard", () => {
  it("should link to the snapshot page", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ id: "snapshot-1" });
    render(<SnapshotCard snapshot={snapshot} projectId="project-1" buildId="build-1" />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/projects/project-1/builds/build-1/snapshots/snapshot-1",
    );
  });

  it("should carry the build's filters into the snapshot link", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ id: "snapshot-1" });
    render(
      <SnapshotCard
        snapshot={snapshot}
        projectId="project-1"
        buildId="build-1"
        filters={{ statuses: ["needs_review"], browsers: ["chromium"], viewports: [] }}
      />,
    );

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/projects/project-1/builds/build-1/snapshots/snapshot-1?status=needs_review&browser=chromium",
    );
  });

  it("should show a warning badge when the snapshot has an uncaught page error", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ hasUncaughtPageError: true });
    render(<SnapshotCard snapshot={snapshot} projectId="project-1" buildId="build-1" />);

    expect(screen.getByRole("img", { name: "warning" })).toBeInTheDocument();
  });

  it("should not show a warning badge when the snapshot has no warnings", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ hasUncaughtPageError: false });
    render(<SnapshotCard snapshot={snapshot} projectId="project-1" buildId="build-1" />);

    expect(screen.queryByRole("img", { name: "warning" })).not.toBeInTheDocument();
  });

  it("should show a flaky badge when the story has been flagged as flaky", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ isFlaky: true });
    render(<SnapshotCard snapshot={snapshot} projectId="project-1" buildId="build-1" />);

    expect(screen.getByRole("img", { name: "flaky" })).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAccessibleName(expect.stringContaining(", flaky"));
  });

  it("should not show a flaky badge when the story has not been flagged", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ isFlaky: false });
    render(<SnapshotCard snapshot={snapshot} projectId="project-1" buildId="build-1" />);

    expect(screen.queryByRole("img", { name: "flaky" })).not.toBeInTheDocument();
  });
});
