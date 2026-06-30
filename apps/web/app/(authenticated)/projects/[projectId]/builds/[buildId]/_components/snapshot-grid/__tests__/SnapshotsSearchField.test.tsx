import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotsSearchField } from "../SnapshotsSearchField";

describe("SnapshotsSearchField", () => {
  it("should initialize the field from the search value", () => {
    render(<SnapshotsSearchField projectId="project-1" buildId="build-1" search="home" />);

    expect(screen.getByLabelText("search snapshots")).toHaveValue("home");
  });

  it("should point the clear button back to the build page", () => {
    render(<SnapshotsSearchField projectId="project-1" buildId="build-1" search="home" />);

    expect(screen.getByRole("button", { name: "clear search" })).toHaveAttribute(
      "href",
      "/projects/project-1/builds/build-1",
    );
  });
});
