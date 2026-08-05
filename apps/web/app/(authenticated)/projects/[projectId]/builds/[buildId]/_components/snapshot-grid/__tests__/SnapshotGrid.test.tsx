import { mockAllIsIntersecting } from "react-intersection-observer/test-utils";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { SnapshotGrid } from "../SnapshotGrid";

describe("SnapshotGrid", () => {
  it("should render a card for every snapshot", () => {
    const snapshots = [
      mocks.build.generateBuildSnapshot({ targetName: "home-page", status: "unchanged" }),
      mocks.build.generateBuildSnapshot({ targetName: "checkout-page", status: "needs_review" }),
    ];

    render(<SnapshotGrid snapshots={snapshots} projectId="project-1" buildId="build-1" />);

    expect(screen.getByText("home-page")).toBeVisible();
    expect(screen.getByText("checkout-page")).toBeVisible();
  });

  it("should show an empty message when there are no snapshots", () => {
    render(<SnapshotGrid snapshots={[]} projectId="project-1" buildId="build-1" />);

    expect(screen.getByText("no snapshots found")).toBeVisible();
  });

  it("should show the search term when no snapshots match", () => {
    render(<SnapshotGrid snapshots={[]} projectId="project-1" buildId="build-1" search="home" />);

    expect(screen.getByText('no snapshots found matching "home"')).toBeVisible();
  });

  it("should announce how many snapshots are shown out of the total", () => {
    const snapshots = [mocks.build.generateBuildSnapshot(), mocks.build.generateBuildSnapshot()];

    render(
      <SnapshotGrid snapshots={snapshots} projectId="project-1" buildId="build-1" total={57} />,
    );

    expect(screen.getByRole("status", { name: "snapshot count" })).toHaveTextContent(
      "showing 2 of 57 snapshots",
    );
  });

  it("should load more snapshots when the end of the list comes into view", async () => {
    const onLoadMore = vi.fn();

    render(
      <SnapshotGrid
        snapshots={[mocks.build.generateBuildSnapshot()]}
        projectId="project-1"
        buildId="build-1"
        hasNextPage
        onLoadMore={onLoadMore}
      />,
    );

    mockAllIsIntersecting(true);

    await waitFor(() => expect(onLoadMore).toHaveBeenCalled());
  });

  it("should not load more snapshots when there are none left", async () => {
    const onLoadMore = vi.fn();

    render(
      <SnapshotGrid
        snapshots={[mocks.build.generateBuildSnapshot()]}
        projectId="project-1"
        buildId="build-1"
        hasNextPage={false}
        onLoadMore={onLoadMore}
      />,
    );

    mockAllIsIntersecting(true);

    await waitFor(() => expect(onLoadMore).not.toHaveBeenCalled());
  });

  it("should not load more snapshots while a page is already loading", async () => {
    const onLoadMore = vi.fn();

    render(
      <SnapshotGrid
        snapshots={[mocks.build.generateBuildSnapshot()]}
        projectId="project-1"
        buildId="build-1"
        hasNextPage
        isFetchingNextPage
        onLoadMore={onLoadMore}
      />,
    );

    mockAllIsIntersecting(true);

    await waitFor(() => expect(onLoadMore).not.toHaveBeenCalled());
  });

  // The loading placeholders are aria-hidden decoration, so they are
  // deliberately not asserted here — the live region above is what actually
  // reports progress, and the sentinel's presence is covered by the load-more
  // tests, which cannot fire without it.

  it("should only list the real snapshots, not the loading placeholders", () => {
    const snapshots = [
      mocks.build.generateBuildSnapshot({ targetName: "home-page" }),
      mocks.build.generateBuildSnapshot({ targetName: "checkout-page" }),
    ];

    render(
      <SnapshotGrid snapshots={snapshots} projectId="project-1" buildId="build-1" hasNextPage />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
