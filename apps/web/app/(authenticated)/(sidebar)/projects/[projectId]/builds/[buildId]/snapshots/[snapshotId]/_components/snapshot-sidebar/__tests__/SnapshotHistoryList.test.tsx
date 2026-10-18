import { mocks } from "@ovr/mocks";

import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotHistoryList } from "../SnapshotHistoryList";

describe("SnapshotHistoryList", () => {
  it("should render a card for every entry", () => {
    const entries = [
      mocks.build.generateSnapshotHistoryEntry({ buildName: "Add checkout page" }),
      mocks.build.generateSnapshotHistoryEntry({ buildName: "Fix header spacing" }),
    ];

    render(
      <SnapshotHistoryList
        entries={entries}
        branch="main"
        projectId="project-1"
        snapshotId="snapshot-1"
      />,
    );

    expect(screen.getByText("Add checkout page")).toBeVisible();
    expect(screen.getByText("Fix header spacing")).toBeVisible();
  });

  it("should mark the entry for the snapshot being viewed", () => {
    const entries = [
      mocks.build.generateSnapshotHistoryEntry({ id: "snapshot-2" }),
      mocks.build.generateSnapshotHistoryEntry({ id: "snapshot-1" }),
    ];

    render(
      <SnapshotHistoryList
        entries={entries}
        branch="main"
        projectId="project-1"
        snapshotId="snapshot-1"
      />,
    );

    expect(screen.getByRole("link", { current: "page" })).toHaveAttribute(
      "href",
      expect.stringContaining("/snapshots/snapshot-1"),
    );
  });

  it("should show an empty message naming the branch when there is no history", () => {
    render(
      <SnapshotHistoryList
        entries={[]}
        branch="main"
        projectId="project-1"
        snapshotId="snapshot-1"
      />,
    );

    expect(screen.getByText("no snapshots on main yet")).toBeVisible();
  });
});
