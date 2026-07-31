import { describe, expect, it, render, screen } from "@/test-utils";

import { ProjectHeader, type ProjectHeaderProps } from "../ProjectHeader";

const renderComponent = ({
  projectId = "01900000-0000-7000-8000-000000000099",
  projectName = "My Project",
  role = "admin",
}: Partial<ProjectHeaderProps> = {}) => {
  return render(<ProjectHeader projectId={projectId} projectName={projectName} role={role} />);
};

describe("ProjectHeader", () => {
  it("should render the project name", () => {
    renderComponent({ projectName: "My Project" });

    expect(screen.getByRole("heading", { name: "My Project" })).toBeVisible();
  });

  it("should show the project settings link for admins", () => {
    renderComponent({ projectId: "01900000-0000-7000-8000-000000000099", role: "admin" });

    expect(screen.getByRole("link", { name: /project settings/i })).toHaveAttribute(
      "href",
      "/projects/01900000-0000-7000-8000-000000000099/settings",
    );
  });

  it("should not show the project settings link for a reviewer", () => {
    renderComponent({ role: "reviewer" });

    expect(screen.queryByRole("link", { name: /project settings/i })).not.toBeInTheDocument();
  });

  it("should not show the project settings link for a viewer", () => {
    renderComponent({ role: "viewer" });

    expect(screen.queryByRole("link", { name: /project settings/i })).not.toBeInTheDocument();
  });

  it("should not show the project settings link when there is no role", () => {
    renderComponent({ role: null });

    expect(screen.queryByRole("link", { name: /project settings/i })).not.toBeInTheDocument();
  });
});
