import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { describe, expect, it, render, screen, waitFor, within } from "@/test-utils";

import { GitIntegrationForm } from "../GitIntegrationForm";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockUpsert = vi.mocked(serverClient.gitIntegrations.upsert);
const mockRemove = vi.mocked(serverClient.gitIntegrations.remove);
const mockSetStatusChecks = vi.mocked(serverClient.gitIntegrations.setStatusChecks);
const mockTestConnection = vi.mocked(serverClient.gitIntegrations.testConnection);
const mockRefresh = vi.mocked(useRouter)().refresh;

const PROJECT_ID = "project-id";

const INTEGRATION = {
  provider: "github" as const,
  repoIdentifier: "acme/web",
  checkContext: "Open Visual Regression / Web",
  statusChecksEnabled: true,
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
  it("should not show disconnect or test connection when no integration is configured", () => {
    renderComponent(null);

    expect(screen.queryByRole("button", { name: /disconnect/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /test connection/i })).not.toBeInTheDocument();
  });

  it("should render the integration's current values", () => {
    renderComponent(INTEGRATION);

    expect(screen.getByLabelText(/repository/i)).toHaveValue(INTEGRATION.repoIdentifier);
    expect(screen.getByLabelText(/access token/i)).toHaveValue("");
    expect(screen.getByRole("button", { name: /disconnect/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /test connection/i })).toBeVisible();
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
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should update an existing integration without re-entering the token", async ({ user }) => {
    mockUpsert.mockResolvedValue([null, { ...INTEGRATION, repoIdentifier: "acme/renamed" }]);
    renderComponent(INTEGRATION);

    await user.clear(screen.getByLabelText(/repository/i));
    await user.type(screen.getByLabelText(/repository/i), "acme/renamed");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ repoIdentifier: "acme/renamed", token: undefined }),
      ),
    );
  });

  it("should disconnect the integration", async ({ user }) => {
    mockRemove.mockResolvedValue([null, undefined]);
    renderComponent(INTEGRATION);

    await user.click(screen.getByRole("button", { name: /disconnect/i }));

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith({ projectId: PROJECT_ID }));
    expect(await screen.findByText("git integration removed")).toBeVisible();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should disable ci checks after confirming", async ({ user }) => {
    mockSetStatusChecks.mockResolvedValue([null, { ...INTEGRATION, statusChecksEnabled: false }]);
    renderComponent(INTEGRATION);

    await user.click(screen.getByRole("button", { name: /^disable$/i }));
    expect(mockSetStatusChecks).not.toHaveBeenCalled();

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /^disable$/i }));

    await waitFor(() =>
      expect(mockSetStatusChecks).toHaveBeenCalledWith({ projectId: PROJECT_ID, enabled: false }),
    );
    expect(await screen.findByText("ci checks disabled")).toBeVisible();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should not disable ci checks when the dialog is cancelled", async ({ user }) => {
    renderComponent(INTEGRATION);

    await user.click(screen.getByRole("button", { name: /^disable$/i }));
    await user.click(await screen.findByRole("button", { name: /cancel/i }));

    expect(mockSetStatusChecks).not.toHaveBeenCalled();
  });

  it("should offer to enable ci checks when they are disabled", async ({ user }) => {
    mockSetStatusChecks.mockResolvedValue([null, INTEGRATION]);
    renderComponent({ ...INTEGRATION, statusChecksEnabled: false });

    expect(screen.queryByRole("button", { name: /^disable$/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^enable$/i }));

    await waitFor(() =>
      expect(mockSetStatusChecks).toHaveBeenCalledWith({ projectId: PROJECT_ID, enabled: true }),
    );
    expect(await screen.findByText("ci checks enabled")).toBeVisible();
  });

  it("should not show disable when no integration is configured", () => {
    renderComponent(null);

    expect(screen.queryByRole("button", { name: /^disable$/i })).not.toBeInTheDocument();
  });

  it("should show the result of testing the connection", async ({ user }) => {
    mockTestConnection.mockResolvedValue([
      null,
      { ok: false, httpStatus: 401, error: "invalid credentials" },
    ]);
    renderComponent(INTEGRATION);

    await user.click(screen.getByRole("button", { name: /test connection/i }));

    await waitFor(() => expect(mockTestConnection).toHaveBeenCalledWith({ projectId: PROJECT_ID }));
    expect(await screen.findByText("invalid credentials")).toBeVisible();
  });
});
