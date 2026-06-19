import { describe, expect, it, render, screen } from "@/test-utils";
import { mocks } from "@ovr/mocks";
import { SnapshotCard } from "../SnapshotCard";

describe("SnapshotCard", () => {
  it("should not show the diff percent badge when diffPercent is 0", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ diffPercent: 0 });
    render(<SnapshotCard snapshot={snapshot} projectId="project-1" buildId="build-1" />);

    expect(screen.queryByText(/Δ/)).not.toBeInTheDocument();
  });

  it("should not show the diff percent badge when diffPercent is null", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ diffPercent: null });
    render(<SnapshotCard snapshot={snapshot} projectId="project-1" buildId="build-1" />);

    expect(screen.queryByText(/Δ/)).not.toBeInTheDocument();
  });

  it("should link to the snapshot page when the snapshot has a diff", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ id: "snapshot-1", diffId: "diff-1" });
    render(<SnapshotCard snapshot={snapshot} projectId="project-1" buildId="build-1" />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/projects/project-1/builds/build-1/snapshot/snapshot-1",
    );
  });

  it("should link to the snapshot page when the snapshot has no diff", () => {
    const snapshot = mocks.build.generateBuildSnapshot({ id: "snapshot-1", diffId: null });
    render(<SnapshotCard snapshot={snapshot} projectId="project-1" buildId="build-1" />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/projects/project-1/builds/build-1/snapshot/snapshot-1",
    );
  });
});
