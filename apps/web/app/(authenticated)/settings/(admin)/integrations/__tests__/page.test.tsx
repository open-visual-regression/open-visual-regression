import { notFound } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen } from "@/test-utils";

import SettingsIntegrationsPage from "../page";

vi.mock("next/headers");
vi.mock("next/navigation");
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/router");

const mockGetSession = vi.mocked(auth.api.getSession);
const mockGithubAppStatus = vi.mocked(serverClient.githubApp.status);
const mockNotFound = vi.mocked(notFound);

describe("SettingsIntegrationsPage", () => {
  it("should show the github app for admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGithubAppStatus.mockResolvedValue([
      null,
      {
        status: "ok",
        app: mocks.githubApp.generateGithubApp(),
        installations: [mocks.githubApp.generateGithubAppInstallation()],
      },
    ]);

    render(await SettingsIntegrationsPage());

    expect(screen.getByRole("heading", { name: /^integrations$/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /github app/i })).toBeVisible();
    expect(screen.getByText("connected")).toBeVisible();
  });

  it("should show a not found page for non-admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "reviewer" }),
      session: mocks.session.generateSession(),
    });

    render(await SettingsIntegrationsPage());

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should show an error page when the github app status cannot be retrieved", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGithubAppStatus.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);

    await expect(SettingsIntegrationsPage()).rejects.toThrow();
  });
});
