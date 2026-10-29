import { useRouter } from "next/navigation";
import { vi } from "vitest";

import type { GitIntegrationSchema } from "@ovr/api/contracts/gitIntegrations";
import { mocks } from "@ovr/mocks";
import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { describe, expect, it, render, screen, waitFor, within } from "@/test-utils";

import { GitIntegrationActions } from "../GitIntegrationActions";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockRemove = vi.mocked(serverClient.gitIntegrations.remove);
const mockSetStatusChecks = vi.mocked(serverClient.gitIntegrations.setStatusChecks);
const mockTestConnection = vi.mocked(serverClient.gitIntegrations.testConnection);
const mockRefresh = vi.mocked(useRouter)().refresh;

const PROJECT_ID = "project-id";
const INTEGRATION = mocks.gitIntegration.generateGitIntegration();

const renderActions = (integration: GitIntegrationSchema | null = INTEGRATION) =>
  render(
    <>
      <GitIntegrationActions projectId={PROJECT_ID} integration={integration} isSaving={false} />
      <Toaster />
    </>,
  );

describe("GitIntegrationActions", () => {
  it("should only offer to save when no integration is configured", () => {
    renderActions(null);

    expect(screen.getByRole("button", { name: /^save$/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /disconnect/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /test connection/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^disable$/i })).not.toBeInTheDocument();
  });

  it("should disconnect the integration", async ({ user }) => {
    mockRemove.mockResolvedValue([null, undefined]);
    renderActions();

    await user.click(screen.getByRole("button", { name: /disconnect/i }));

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith({ projectId: PROJECT_ID }));
    expect(await screen.findByText("git integration removed")).toBeVisible();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should disable ci checks after confirming", async ({ user }) => {
    mockSetStatusChecks.mockResolvedValue([null, { ...INTEGRATION, statusChecksEnabled: false }]);
    renderActions();

    await user.click(screen.getByRole("button", { name: /^disable$/i }));
    expect(mockSetStatusChecks).not.toHaveBeenCalled();

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("disable git integration?")).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: /^disable$/i }));

    await waitFor(() =>
      expect(mockSetStatusChecks).toHaveBeenCalledWith({ projectId: PROJECT_ID, enabled: false }),
    );
    expect(await screen.findByText("ci checks disabled")).toBeVisible();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should not disable ci checks when the dialog is cancelled", async ({ user }) => {
    renderActions();

    await user.click(screen.getByRole("button", { name: /^disable$/i }));
    await user.click(await screen.findByRole("button", { name: /cancel/i }));

    expect(mockSetStatusChecks).not.toHaveBeenCalled();
  });

  it("should offer to enable ci checks when they are disabled", async ({ user }) => {
    mockSetStatusChecks.mockResolvedValue([null, INTEGRATION]);
    renderActions({ ...INTEGRATION, statusChecksEnabled: false });

    expect(screen.queryByRole("button", { name: /^disable$/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^enable$/i }));

    await waitFor(() =>
      expect(mockSetStatusChecks).toHaveBeenCalledWith({ projectId: PROJECT_ID, enabled: true }),
    );
    expect(await screen.findByText("ci checks enabled")).toBeVisible();
  });

  it("should show the result of testing the connection", async ({ user }) => {
    mockTestConnection.mockResolvedValue([
      null,
      { ok: false, httpStatus: 401, error: "invalid credentials" },
    ]);
    renderActions();

    await user.click(screen.getByRole("button", { name: /test connection/i }));

    await waitFor(() => expect(mockTestConnection).toHaveBeenCalledWith({ projectId: PROJECT_ID }));
    expect(await screen.findByText("invalid credentials")).toBeVisible();
  });
});
