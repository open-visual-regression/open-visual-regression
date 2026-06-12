import { vi } from "vitest";

import { describe, expect, it, render, screen } from "@/test-utils";
import { auth } from "@/lib/auth/auth";
import { router } from "@/lib/router";
import { mocks } from "@ovr/mocks";
import { notFound } from "next/navigation";
import { createORPCError } from "@/lib/testing/orpc";
import ProjectSettingsPage, { ProjectSettingsPageProps } from "../page";

vi.mock("next/headers");
vi.mock("next/navigation");
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/router");

const mockGetSession = vi.mocked(auth.api.getSession);
const mockListApiKeys = vi.mocked(router.apiKeys.list);
const mockNotFound = vi.mocked(notFound);

const PROJECT_ID = "test-project-id";
const pageProps: ProjectSettingsPageProps = {
  params: Promise.resolve({ projectId: PROJECT_ID }),
  searchParams: Promise.resolve({}),
};

describe("ProjectSettingsPage", () => {
  it("should show the settings page for admins with no api keys", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockListApiKeys.mockResolvedValue([null, { apiKeys: [], total: 0 }]);

    render(await ProjectSettingsPage(pageProps));

    expect(screen.getByRole("heading", { name: /settings/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /no api keys yet/i })).toBeVisible();
  });

  it("should show the settings page for admins with existing api keys", async () => {
    const apiKey = mocks.apiKey.generateApiKey();
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockListApiKeys.mockResolvedValue([null, { apiKeys: [apiKey], total: 1 }]);

    render(await ProjectSettingsPage(pageProps));

    expect(screen.getByRole("heading", { name: /settings/i })).toBeVisible();
    expect(screen.getByText(apiKey.name)).toBeVisible();
  });

  it("should show a not found page for non-admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser({ role: "user" }),
      session: mocks.session.generateSession(),
    });

    render(await ProjectSettingsPage(pageProps));

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should show an error page when the session cannot be retrieved", async () => {
    mockGetSession.mockRejectedValue(new Error("DB connection failed"));

    await expect(ProjectSettingsPage(pageProps)).rejects.toThrow();
  });

  it("should show an error page when the api keys cannot be retrieved", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockListApiKeys.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);

    await expect(ProjectSettingsPage(pageProps)).rejects.toThrow();
  });
});
