import { describe, expect, it, render, screen } from "@/test-utils";
import { mocks } from "@ovr/mocks";
import { RunHeader } from "../RunHeader";

describe("RunHeader", () => {
  it("should render the SegmentedProgress segments with the correct counts", () => {
    const build = mocks.build.generateBuild();
    render(
      <RunHeader build={build} snapshotCounts={{ pass: 3, changed: 2, fail: 1, pending: 4 }} />,
    );

    expect(screen.getByText("10 snapshots")).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
    expect(screen.getByText("pass")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
    expect(screen.getByText("changed")).toBeVisible();
    expect(screen.getByText("1")).toBeVisible();
    expect(screen.getByText("failed")).toBeVisible();
    expect(screen.getByText("4")).toBeVisible();
    expect(screen.getByText("pending")).toBeVisible();
  });
});
