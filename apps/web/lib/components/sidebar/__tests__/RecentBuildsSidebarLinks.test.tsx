import { mocks } from "@ovr/mocks";
import { describe, expect, it, render, screen } from "@/test-utils";
import { RecentBuildsSidebarLinks, RECENT_BUILDS_FETCH_LIMIT } from "../RecentBuildsSidebarLinks";

describe("RecentBuildsSidebarLinks", () => {
  it("should render nothing when there are no builds", () => {
    const { container } = render(<RecentBuildsSidebarLinks builds={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("should render a row for each build, showing the project, branch, and build name", () => {
    const build = mocks.build.generateBuild({
      project: { id: "project-1", name: "Acme Web" },
      branch: "feature/checkout",
      name: "Fix checkout layout",
    });

    render(<RecentBuildsSidebarLinks builds={[build]} />);

    expect(screen.getByText("Acme Web · feature/checkout")).toBeVisible();
    expect(screen.getByText("Fix checkout layout")).toBeVisible();
  });

  it("should fall back to the short commit sha when the build has no name", () => {
    const build = mocks.build.generateBuild({ name: null, commitSha: "abcdef1234567890" });

    render(<RecentBuildsSidebarLinks builds={[build]} />);

    expect(screen.getByText("abcdef1")).toBeVisible();
  });

  it("should link to the build detail page", () => {
    const build = mocks.build.generateBuild({
      id: "build-1",
      project: { id: "project-1", name: "Acme Web" },
    });

    render(<RecentBuildsSidebarLinks builds={[build]} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/projects/project-1/builds/build-1");
  });

  it("should only render up to the fetch limit, even if more builds are passed", () => {
    const builds = Array.from({ length: RECENT_BUILDS_FETCH_LIMIT + 5 }, () =>
      mocks.build.generateBuild(),
    );

    render(<RecentBuildsSidebarLinks builds={builds} />);

    expect(screen.getAllByRole("link")).toHaveLength(RECENT_BUILDS_FETCH_LIMIT);
  });

  it("should show the section heading", () => {
    render(<RecentBuildsSidebarLinks builds={[mocks.build.generateBuild()]} />);

    expect(screen.getByRole("heading", { name: "recent builds" })).toBeVisible();
  });
});
