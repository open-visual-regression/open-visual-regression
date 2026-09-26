import { vi } from "vitest";

import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { UpdateProjectForm } from "../UpdateProjectForm";

vi.mock("@/lib/router");

const mockUpdate = vi.mocked(serverClient.projects.update);

const PROJECT = {
  id: "project-id",
  name: "Test Project",
  description: "A test project",
  gitMainBranch: "main",
  retentionDays: 90,
  requiredReviewerCount: 1,
};

const renderComponent = () =>
  render(
    <>
      <UpdateProjectForm project={PROJECT} />
      <Toaster />
    </>,
  );

describe("UpdateProjectForm", () => {
  it("should render the project's current settings", () => {
    renderComponent();

    expect(screen.getByLabelText(/^name$/i)).toHaveValue(PROJECT.name);
    expect(screen.getByLabelText(/required reviewers/i)).toHaveValue(PROJECT.requiredReviewerCount);
  });

  it("should show a validation error when required reviewers is less than 1", async ({ user }) => {
    renderComponent();

    await user.clear(screen.getByLabelText(/required reviewers/i));
    await user.type(screen.getByLabelText(/required reviewers/i), "0");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("required reviewer count must be at least 1")).toBeVisible();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should submit the updated required reviewer count", async ({ user }) => {
    mockUpdate.mockResolvedValue([null, undefined]);
    renderComponent();

    await user.clear(screen.getByLabelText(/required reviewers/i));
    await user.type(screen.getByLabelText(/required reviewers/i), "3");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith({
        id: PROJECT.id,
        patch: expect.objectContaining({ requiredReviewerCount: 3 }),
      }),
    );
    expect(await screen.findByText("settings saved")).toBeVisible();
  });
});
