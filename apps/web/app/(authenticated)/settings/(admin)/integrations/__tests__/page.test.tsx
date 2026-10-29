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
const mockConnections = vi.mocked(serverClient.gitProviders.connections);
const mockNotFound = vi.mocked(notFound);

const signInAs = (role: "admin" | "reviewer") =>
  mockGetSession.mockResolvedValue({
    user: mocks.user.generateAuthUser({ role }),
    session: mocks.session.generateSession(),
  });

describe("SettingsIntegrationsPage", () => {
  it("should show a section for each provider with connections", async () => {
    signInAs("admin");
    mockConnections.mockResolvedValue([
      null,
      { providers: [mocks.gitProvider.generateProviderConnections()] },
    ]);

    render(await SettingsIntegrationsPage());

    expect(screen.getByRole("heading", { name: /^integrations$/i })).toBeVisible();
    expect(screen.getByRole("region", { name: "github github app" })).toBeVisible();
    expect(screen.getByText("connected")).toBeVisible();
  });

  it("should show a not found page for non-admins", async () => {
    signInAs("reviewer");

    render(await SettingsIntegrationsPage());

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should show an error page when the connections cannot be retrieved", async () => {
    signInAs("admin");
    mockConnections.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);

    await expect(SettingsIntegrationsPage()).rejects.toThrow();
  });
});
