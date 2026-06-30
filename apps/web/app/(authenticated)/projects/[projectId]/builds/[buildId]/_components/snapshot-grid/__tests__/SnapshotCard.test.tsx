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
});
