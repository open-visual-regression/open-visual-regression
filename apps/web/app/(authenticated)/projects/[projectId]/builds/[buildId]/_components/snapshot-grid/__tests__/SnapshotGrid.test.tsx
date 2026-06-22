import { describe, expect, it, render, screen } from "@/test-utils";
import { mocks } from "@ovr/mocks";
import { SnapshotGrid } from "../SnapshotGrid";

describe("SnapshotGrid", () => {
  it("should render a card for every snapshot", () => {
    const snapshots = [
      mocks.build.generateBuildSnapshot({ targetName: "home-page", status: "pass" }),
      mocks.build.generateBuildSnapshot({ targetName: "checkout-page", status: "changed" }),
    ];

    render(<SnapshotGrid snapshots={snapshots} projectId="project-1" buildId="build-1" />);

    expect(screen.getByText("home-page")).toBeVisible();
    expect(screen.getByText("checkout-page")).toBeVisible();
  });
});
