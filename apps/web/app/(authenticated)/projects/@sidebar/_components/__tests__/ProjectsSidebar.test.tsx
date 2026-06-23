import { vi } from "vitest";
import { usePathname } from "next/navigation";

import { mocks } from "@ovr/mocks";
import { describe, expect, it, render, screen } from "@/test-utils";
import { ProjectsSidebar, type ProjectsSidebarProps } from "../ProjectsSidebar";

vi.mock("next/navigation");

const PROJECTS: ProjectsSidebarProps["projects"] = [
  { id: "project-1", name: "Alpha" },
  { id: "project-2", name: "Beta" },
];

const BUILDS: ProjectsSidebarProps["builds"] = [mocks.build.generateBuild()];

describe("ProjectsSidebar", () => {
  it("should mark the project matching the current path as active", () => {
    vi.mocked(usePathname).mockReturnValue("/projects/project-2");

    render(<ProjectsSidebar projects={PROJECTS} total={PROJECTS.length} builds={BUILDS} />);

    expect(screen.getByRole("link", { name: "Alpha" })).toHaveClass("border-l-transparent");
    expect(screen.getByRole("link", { name: "Beta" })).toHaveClass("border-l-ovr-accent");
  });

  it("should not mark any project as active when the path doesn't match any project", () => {
    vi.mocked(usePathname).mockReturnValue("/projects");

    render(<ProjectsSidebar projects={PROJECTS} total={PROJECTS.length} builds={BUILDS} />);

    expect(screen.getByRole("link", { name: "Alpha" })).toHaveClass("border-l-transparent");
    expect(screen.getByRole("link", { name: "Beta" })).toHaveClass("border-l-transparent");
  });

  it("should show the total project count in the section heading", () => {
    vi.mocked(usePathname).mockReturnValue("/projects");

    render(<ProjectsSidebar projects={PROJECTS} total={5} builds={BUILDS} />);

    expect(screen.getByRole("heading", { name: "projects" })).toBeVisible();
    expect(screen.getByText("(5)")).toBeVisible();
  });

  it("should always render a link to view all projects, even when every project is already shown", () => {
    vi.mocked(usePathname).mockReturnValue("/projects");

    render(<ProjectsSidebar projects={PROJECTS} total={PROJECTS.length} builds={BUILDS} />);

    expect(screen.getByRole("link", { name: "view all" })).toHaveAttribute("href", "/projects");
  });

  it("should render the recent builds section when builds are provided", () => {
    vi.mocked(usePathname).mockReturnValue("/projects");

    render(<ProjectsSidebar projects={PROJECTS} total={PROJECTS.length} builds={BUILDS} />);

    expect(screen.getByRole("heading", { name: "recent builds" })).toBeVisible();
  });

  it("should not render the recent builds section when there are no builds", () => {
    vi.mocked(usePathname).mockReturnValue("/projects");

    render(<ProjectsSidebar projects={PROJECTS} total={PROJECTS.length} builds={[]} />);

    expect(screen.queryByRole("heading", { name: "recent builds" })).not.toBeInTheDocument();
  });
});
