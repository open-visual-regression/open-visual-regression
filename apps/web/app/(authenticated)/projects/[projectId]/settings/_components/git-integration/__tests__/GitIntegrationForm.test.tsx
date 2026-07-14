import { vi } from "vitest";

import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { GitIntegrationForm } from "../GitIntegrationForm";

vi.mock("@/lib/router");

const mockUpsert = vi.mocked(serverClient.gitIntegrations.upsert);
const mockRemove = vi.mocked(serverClient.gitIntegrations.remove);

const PROJECT_ID = "project-id";

const INTEGRATION = {
  provider: "github" as const,
  baseUrl: null,
  repoIdentifier: "acme/web",
  checkContext: "ovr/visual-review",
  hasToken: true as const,
};

const renderComponent = (integration: typeof INTEGRATION | null = null) =>
  render(
    <>
      <GitIntegrationForm projectId={PROJECT_ID} integration={integration} />
      <Toaster />
    </>,
  );

describe("GitIntegrationForm", () => {
  it("should not show disconnect when no integration is configured", () => {
    renderComponent(null);

    expect(screen.queryByRole("button", { name: /disconnect/i })).not.toBeInTheDocument();
  });

  it("should render the integration's current values", () => {
    renderComponent(INTEGRATION);

    expect(screen.getByLabelText(/repository/i)).toHaveValue(INTEGRATION.repoIdentifier);
    expect(screen.getByLabelText(/access token/i)).toHaveValue("");
    expect(screen.getByRole("button", { name: /disconnect/i })).toBeVisible();
  });

  it("should show a validation error when repository is blank", async ({ user }) => {
    renderComponent(null);

    await user.type(screen.getByLabelText(/access token/i), "a-token");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("you must enter a repository")).toBeVisible();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("should submit the integration", async ({ user }) => {
    mockUpsert.mockResolvedValue([null, { ...INTEGRATION, repoIdentifier: "acme/other" }]);
    renderComponent(null);

    await user.type(screen.getByLabelText(/repository/i), "acme/other");
    await user.type(screen.getByLabelText(/access token/i), "a-token");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: PROJECT_ID,
          repoIdentifier: "acme/other",
          token: "a-token",
        }),
      ),
    );
    expect(await screen.findByText("git integration saved")).toBeVisible();
  });

  it("should disconnect the integration", async ({ user }) => {
    mockRemove.mockResolvedValue([null, undefined]);
    renderComponent(INTEGRATION);

    await user.click(screen.getByRole("button", { name: /disconnect/i }));

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith({ projectId: PROJECT_ID }));
    expect(await screen.findByText("git integration removed")).toBeVisible();
  });
});
