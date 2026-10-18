import { mocks } from "@ovr/mocks";

import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotHistoryCard } from "../SnapshotHistoryCard";

describe("SnapshotHistoryCard", () => {
  it("should link to the snapshot in its build", () => {
    const entry = mocks.build.generateSnapshotHistoryEntry({
      id: "snapshot-1",
      buildId: "build-1",
    });
    render(<SnapshotHistoryCard entry={entry} projectId="project-1" />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/projects/project-1/builds/build-1/snapshots/snapshot-1",
    );
  });

  it("should show the build name and short commit", () => {
    const entry = mocks.build.generateSnapshotHistoryEntry({
      buildName: "Add checkout page",
      commitSha: "a1b2c3d4e5f6".padEnd(40, "0"),
    });
    render(<SnapshotHistoryCard entry={entry} projectId="project-1" />);

    expect(screen.getByText("Add checkout page")).toBeVisible();
    expect(screen.getByText("a1b2c3d")).toBeVisible();
  });

  it("should fall back to the short commit when the build has no name", () => {
    const entry = mocks.build.generateSnapshotHistoryEntry({
      buildName: null,
      commitSha: "a1b2c3d4e5f6".padEnd(40, "0"),
    });
    render(<SnapshotHistoryCard entry={entry} projectId="project-1" />);

    expect(screen.getAllByText("a1b2c3d")).toHaveLength(2);
  });

  it("should show the snapshot's status", () => {
    const entry = mocks.build.generateSnapshotHistoryEntry({ status: "needs_review" });
    render(<SnapshotHistoryCard entry={entry} projectId="project-1" />);

    expect(screen.getByText("needs review")).toBeVisible();
  });

  it("should show a warning badge when the snapshot has a warning", () => {
    const entry = mocks.build.generateSnapshotHistoryEntry({ flags: ["warning"] });
    render(<SnapshotHistoryCard entry={entry} projectId="project-1" />);

    expect(screen.getByRole("img", { name: "warning" })).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAccessibleName(
      expect.stringContaining(", has warnings"),
    );
  });

  it("should not show a warning badge when the snapshot has no warnings", () => {
    const entry = mocks.build.generateSnapshotHistoryEntry({ flags: [] });
    render(<SnapshotHistoryCard entry={entry} projectId="project-1" />);

    expect(screen.queryByRole("img", { name: "warning" })).not.toBeInTheDocument();
  });

  it("should mark the snapshot being viewed", () => {
    const entry = mocks.build.generateSnapshotHistoryEntry();
    render(<SnapshotHistoryCard entry={entry} projectId="project-1" current />);

    expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("this snapshot")).toBeVisible();
  });

  it("should not mark other snapshots as the one being viewed", () => {
    const entry = mocks.build.generateSnapshotHistoryEntry();
    render(<SnapshotHistoryCard entry={entry} projectId="project-1" />);

    expect(screen.getByRole("link")).not.toHaveAttribute("aria-current");
    expect(screen.queryByText("this snapshot")).not.toBeInTheDocument();
  });
});
