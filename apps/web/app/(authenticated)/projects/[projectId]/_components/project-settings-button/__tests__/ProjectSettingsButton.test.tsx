import { describe, expect, it, render, screen } from "@/test-utils";

import { ProjectSettingsButton, type ProjectSettingsButtonProps } from "../ProjectSettingsButton";

const PROJECT_ID = "01900000-0000-7000-8000-000000000099";

const renderComponent = ({
  projectId = PROJECT_ID,
  role = "admin",
}: Partial<ProjectSettingsButtonProps> = {}) => {
  return render(<ProjectSettingsButton projectId={projectId} role={role} />);
};

describe("ProjectSettingsButton", () => {
  it("should show the project settings link for admins", () => {
    renderComponent();

    expect(screen.getByRole("link", { name: /project settings/i })).toHaveAttribute(
      "href",
      `/projects/${PROJECT_ID}/settings`,
    );
  });

  it.each([
    ["a reviewer", "reviewer"],
    ["a viewer", "viewer"],
    ["no role", null],
  ] as const)("should not show the project settings link for %s", (_description, role) => {
    renderComponent({ role });

    expect(screen.queryByRole("link", { name: /project settings/i })).not.toBeInTheDocument();
  });
});
