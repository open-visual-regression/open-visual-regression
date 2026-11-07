import { mocks } from "@ovr/mocks";

import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotCard } from "../SnapshotCard";

describe("SnapshotCard", () => {
  it("should link to the snapshot page", () => {
    const snapshot = mocks.build.generateBuildSnapshot({
      id: "snapshot-1",
      buildId: "build-1",
      project: { id: "project-1", name: "Storefront" },
    });
    render(<SnapshotCard snapshot={snapshot} />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/projects/project-1/builds/build-1/snapshots/snapshot-1",
    );
  });

  it("should carry the build's filters into the snapshot link", () => {
    const snapshot = mocks.build.generateBuildSnapshot({
      id: "snapshot-1",
      buildId: "build-1",
      project: { id: "project-1", name: "Storefront" },
    });
    render(
      <SnapshotCard
        snapshot={snapshot}
        filters={{ statuses: ["needs_review"], browsers: ["chromium"], viewports: [], flags: [] }}
      />,
    );

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/projects/project-1/builds/build-1/snapshots/snapshot-1?status=needs_review&browser=chromium",
    );
  });

  it("should show the baseline when a skipped snapshot has one", () => {
    const snapshot = mocks.build.generateBuildSnapshot({
      status: "skipped",
      imagePath: null,
      baselineImagePath: "projects/p/builds/b/snapshots/baseline.png",
    });
    render(<SnapshotCard snapshot={snapshot} />);

    expect(screen.getByRole("img", { name: /^baseline of / })).toBeInTheDocument();
    expect(screen.getByText("baseline")).toBeInTheDocument();
  });

  it("should show no preview when a skipped snapshot has no baseline", () => {
    const snapshot = mocks.build.generateBuildSnapshot({
      status: "skipped",
      imagePath: null,
      baselineImagePath: null,
    });
    render(<SnapshotCard snapshot={snapshot} />);

    expect(screen.getByText("no preview")).toBeInTheDocument();
    expect(screen.queryByText("baseline")).not.toBeInTheDocument();
  });

  it("should show the processing time when the snapshot has one", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ processingMs: 2500 });
    render(<SnapshotCard snapshot={snapshot} />);

    expect(screen.getByRole("img", { name: "processing time" })).toBeInTheDocument();
  });

  it("should not show the processing time when the snapshot has none", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ processingMs: null });
    render(<SnapshotCard snapshot={snapshot} />);

    expect(screen.queryByRole("img", { name: "processing time" })).not.toBeInTheDocument();
  });

  it("should show a warning badge when the snapshot has an uncaught page error", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ hasUncaughtPageError: true });
    render(<SnapshotCard snapshot={snapshot} />);

    expect(screen.getByRole("img", { name: "warning" })).toBeInTheDocument();
  });

  it("should not show a warning badge when the snapshot has no warnings", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ hasUncaughtPageError: false });
    render(<SnapshotCard snapshot={snapshot} />);

    expect(screen.queryByRole("img", { name: "warning" })).not.toBeInTheDocument();
  });

  it("should show a flaky badge when the story has been flagged as flaky", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ isFlaky: true });
    render(<SnapshotCard snapshot={snapshot} />);

    expect(screen.getByRole("img", { name: "flaky" })).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAccessibleName(expect.stringContaining(", flaky"));
  });

  it("should not show a flaky badge when the story has not been flagged", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ isFlaky: false });
    render(<SnapshotCard snapshot={snapshot} />);

    expect(screen.queryByRole("img", { name: "flaky" })).not.toBeInTheDocument();
  });

  it("should name the snapshot's project when asked to", () => {
    const snapshot = mocks.build.generateBuildSnapshot({
      project: { id: "project-1", name: "Storefront" },
    });
    render(<SnapshotCard snapshot={snapshot} showProject />);

    expect(screen.getByText("Storefront")).toBeVisible();
    expect(screen.getByRole("link")).toHaveAccessibleName(expect.stringContaining(", Storefront,"));
  });

  it("should not name the project by default", () => {
    const snapshot = mocks.build.generateBuildSnapshot({
      project: { id: "project-1", name: "Storefront" },
    });
    render(<SnapshotCard snapshot={snapshot} />);

    expect(screen.queryByText("Storefront")).not.toBeInTheDocument();
  });
});
