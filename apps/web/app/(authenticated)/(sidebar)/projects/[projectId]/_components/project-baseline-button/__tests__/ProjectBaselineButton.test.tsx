import { describe, expect, it, render, screen } from "@/test-utils";

import { ProjectBaselineButton, type ProjectBaselineButtonProps } from "../ProjectBaselineButton";

const PROJECT_ID = "01900000-0000-7000-8000-000000000099";
const BUILD_ID = "01900000-0000-7000-8000-000000000001";

const renderComponent = ({
  projectId = PROJECT_ID,
  baselineBuildId = BUILD_ID,
}: Partial<ProjectBaselineButtonProps> = {}) => {
  return render(<ProjectBaselineButton projectId={projectId} baselineBuildId={baselineBuildId} />);
};

describe("ProjectBaselineButton", () => {
  it("should link to the baseline build", () => {
    renderComponent();

    expect(screen.getByRole("link", { name: /view baseline/i })).toHaveAttribute(
      "href",
      `/projects/${PROJECT_ID}/builds/${BUILD_ID}`,
    );
  });

  it("should not show the button when the project has no baseline build", () => {
    renderComponent({ baselineBuildId: null });

    expect(screen.queryByRole("link", { name: /view baseline/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /view baseline/i })).not.toBeInTheDocument();
  });
});
