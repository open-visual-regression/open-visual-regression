import { describe, expect, it, render, screen } from "@/test-utils";
import { mocks } from "@ovr/mocks";
import { SnapshotGrid } from "../SnapshotGrid";

describe("SnapshotGrid", () => {
  const snapshots = [
    mocks.build.generateBuildSnapshot({ targetId: "home-page", status: "pass" }),
    mocks.build.generateBuildSnapshot({ targetId: "checkout-page", status: "changed" }),
    mocks.build.generateBuildSnapshot({ targetId: "cart-page", status: "fail" }),
  ];

  it("should show every snapshot when the filter is 'all'", () => {
    render(
      <SnapshotGrid snapshots={snapshots} projectId="project-1" buildId="build-1" filter="all" />,
    );

    expect(screen.getByText("home-page")).toBeVisible();
    expect(screen.getByText("checkout-page")).toBeVisible();
    expect(screen.getByText("cart-page")).toBeVisible();
  });

  it("should only show changed snapshots when the filter is 'changed'", () => {
    render(
      <SnapshotGrid
        snapshots={snapshots}
        projectId="project-1"
        buildId="build-1"
        filter="changed"
      />,
    );

    expect(screen.getByText("checkout-page")).toBeVisible();
    expect(screen.queryByText("home-page")).not.toBeInTheDocument();
    expect(screen.queryByText("cart-page")).not.toBeInTheDocument();
  });

  it("should only show passing snapshots when the filter is 'pass'", () => {
    render(
      <SnapshotGrid snapshots={snapshots} projectId="project-1" buildId="build-1" filter="pass" />,
    );

    expect(screen.getByText("home-page")).toBeVisible();
    expect(screen.queryByText("checkout-page")).not.toBeInTheDocument();
    expect(screen.queryByText("cart-page")).not.toBeInTheDocument();
  });

  it("should mark the active filter tab as current", () => {
    render(
      <SnapshotGrid
        snapshots={snapshots}
        projectId="project-1"
        buildId="build-1"
        filter="changed"
      />,
    );

    expect(screen.getByRole("link", { name: /^changed/i })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: /^all/i })).not.toHaveAttribute("aria-current");
  });

  it("should show a message when no snapshots match the filter", () => {
    render(<SnapshotGrid snapshots={[]} projectId="project-1" buildId="build-1" filter="all" />);

    expect(screen.getByText("no snapshots match this filter.")).toBeVisible();
  });
});
