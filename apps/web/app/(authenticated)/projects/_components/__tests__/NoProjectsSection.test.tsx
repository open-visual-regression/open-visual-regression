import { describe, expect, it, render, screen } from "@/test-utils";
import { NoProjectsSection } from "../NoProjectsSection";

const renderComponent = (role: string | null | undefined) =>
  render(<NoProjectsSection role={role} />);

describe("NoProjectsSection", () => {
  it("should show a button to create the first project for admins", () => {
    renderComponent("admin");

    expect(screen.getByRole("button", { name: /create first project/i })).toBeVisible();
  });

  it("should not show a button to create a project for non-admins", () => {
    renderComponent("user");

    expect(screen.queryByRole("button", { name: /create first project/i })).not.toBeInTheDocument();
  });

  it("should not show a button to create a project when not logged in", () => {
    renderComponent(null);

    expect(screen.queryByRole("button", { name: /create first project/i })).not.toBeInTheDocument();
  });

  it("should always show a message that there are no projects yet", () => {
    renderComponent(null);

    expect(screen.getByRole("heading", { name: /no projects yet/i })).toBeVisible();
  });
});
