import { notFound } from "next/navigation";
import { beforeEach, vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen } from "@/test-utils";

import ProjectSettingsPage, { ProjectSettingsPageProps } from "../page";

vi.mock("next/headers");
vi.mock("next/navigation");
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/router");

const mockGetSession = vi.mocked(auth.api.getSession);
const mockGetProject = vi.mocked(serverClient.projects.getOne);
const mockListApiKeys = vi.mocked(serverClient.apiKeys.list);
const mockGetGitIntegration = vi.mocked(serverClient.gitIntegrations.get);
const mockNotFound = vi.mocked(notFound);

const PROJECT_ID = "01900000-0000-7000-8000-000000000099";
const pageProps: ProjectSettingsPageProps = {
  params: Promise.resolve({ projectId: PROJECT_ID }),
  searchParams: Promise.resolve({}),
};

describe("ProjectSettingsPage", () => {
  beforeEach(() => {
    mockGetGitIntegration.mockResolvedValue([null, { integration: null }]);
  });

  it("should show the settings page for admins with no api keys", async () => {
    const project = mocks.project.generateProject({ id: PROJECT_ID });
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetProject.mockResolvedValue([null, { project }]);
    mockListApiKeys.mockResolvedValue([null, { apiKeys: [], total: 0 }]);

    render(await ProjectSettingsPage(pageProps));

    expect(screen.getByRole("heading", { name: /settings/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /no api keys yet/i })).toBeVisible();
  });

  it("should prefill the general form with project values", async () => {
    const project = mocks.project.generateProject({
      id: PROJECT_ID,
      name: "My Project",
      gitMainBranch: "develop",
      retentionDays: 60,
    });
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetProject.mockResolvedValue([null, { project }]);
    mockListApiKeys.mockResolvedValue([null, { apiKeys: [], total: 0 }]);

    render(await ProjectSettingsPage(pageProps));

    expect(screen.getByDisplayValue("My Project")).toBeVisible();
    expect(screen.getByDisplayValue("develop")).toBeVisible();
    expect(screen.getByDisplayValue("60")).toBeVisible();
  });

  it("should show existing api keys", async () => {
    const project = mocks.project.generateProject({ id: PROJECT_ID });
    const apiKey = mocks.apiKey.generateApiKey();
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetProject.mockResolvedValue([null, { project }]);
    mockListApiKeys.mockResolvedValue([null, { apiKeys: [apiKey], total: 1 }]);

    render(await ProjectSettingsPage(pageProps));

    expect(screen.getByText(apiKey.name)).toBeVisible();
  });

  it("should show a not found page for non-admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "reviewer" }),
      session: mocks.session.generateSession(),
    });

    render(await ProjectSettingsPage(pageProps));

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should show a not found page when the project does not exist", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetProject.mockResolvedValue([createORPCError("NOT_FOUND", 404), undefined]);
    mockListApiKeys.mockResolvedValue([null, { apiKeys: [], total: 0 }]);

    render(await ProjectSettingsPage(pageProps));

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should show an error page when the session cannot be retrieved", async () => {
    mockGetSession.mockRejectedValue(new Error("DB connection failed"));

    await expect(ProjectSettingsPage(pageProps)).rejects.toThrow();
  });

  it("should show an error page when the api keys cannot be retrieved", async () => {
    const project = mocks.project.generateProject({ id: PROJECT_ID });
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetProject.mockResolvedValue([null, { project }]);
    mockListApiKeys.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);

    await expect(ProjectSettingsPage(pageProps)).rejects.toThrow();
  });
});
