import { describe, expect, it, render, screen } from "@/test-utils";

import { ProjectBaselineButton, type ProjectBaselineButtonProps } from "../ProjectBaselineButton";

const PROJECT_ID = "01900000-0000-7000-8000-000000000099";

const renderComponent = ({
  projectId = PROJECT_ID,
  hasBaseline = true,
}: Partial<ProjectBaselineButtonProps> = {}) => {
  return render(<ProjectBaselineButton projectId={projectId} hasBaseline={hasBaseline} />);
};

describe("ProjectBaselineButton", () => {
  it("should link to the project's stable baseline URL", () => {
    renderComponent();

    expect(screen.getByRole("link", { name: /view baseline/i })).toHaveAttribute(
      "href",
      `/api/baseline/${PROJECT_ID}`,
    );
  });

  it("should not show the button when the project has no baseline build", () => {
    renderComponent({ hasBaseline: false });

    expect(screen.queryByRole("link", { name: /view baseline/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /view baseline/i })).not.toBeInTheDocument();
  });
});
