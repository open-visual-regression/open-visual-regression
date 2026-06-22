import { describe, expect, it, render, screen } from "@/test-utils";
import { mocks } from "@ovr/mocks";
import { SnapshotGrid } from "../SnapshotGrid";

describe("SnapshotGrid", () => {
  it("should render a card for every snapshot", () => {
    const snapshots = [
      mocks.build.generateBuildSnapshot({ targetName: "home-page", status: "pass" }),
      mocks.build.generateBuildSnapshot({ targetName: "checkout-page", status: "changed" }),
    ];

    render(
      <SnapshotGrid
        snapshots={snapshots}
        projectId="project-1"
        buildId="build-1"
        total={2}
        page={1}
        pageSize={24}
      />,
    );

    expect(screen.getByText("home-page")).toBeVisible();
    expect(screen.getByText("checkout-page")).toBeVisible();
  });

  it("should not render pagination controls when everything fits on one page", () => {
    const snapshots = [mocks.build.generateBuildSnapshot({ targetName: "home-page" })];

    render(
      <SnapshotGrid
        snapshots={snapshots}
        projectId="project-1"
        buildId="build-1"
        total={1}
        page={1}
        pageSize={24}
      />,
    );

    expect(screen.queryByText(/page \d+ of \d+/)).not.toBeInTheDocument();
  });

  it("should render pagination controls when there are multiple pages", () => {
    const snapshots = [mocks.build.generateBuildSnapshot({ targetName: "home-page" })];

    render(
      <SnapshotGrid
        snapshots={snapshots}
        projectId="project-1"
        buildId="build-1"
        total={48}
        page={2}
        pageSize={24}
      />,
    );

    expect(screen.getByText("page 2 of 2")).toBeVisible();
    expect(screen.getByRole("button", { name: "previous" })).toHaveAttribute(
      "href",
      "/projects/project-1/builds/build-1?page=1",
    );
    expect(screen.getByText("next")).toBeVisible();
  });
});
