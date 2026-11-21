import { notFound } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen } from "@/test-utils";

import SettingsBuildsPage from "../page";

vi.mock("next/headers");
vi.mock("next/server");
vi.mock("next/navigation");
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/router");

const mockGetSession = vi.mocked(auth.api.getSession);
const mockGetDiffSettings = vi.mocked(serverClient.settings.getDiffSettings);
const mockNotFound = vi.mocked(notFound);

describe("SettingsBuildsPage", () => {
  it("should show the saved diff setting for admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetDiffSettings.mockResolvedValue([null, { settings: { highlight: "exact" } }]);

    render(await SettingsBuildsPage());

    expect(screen.getByRole("heading", { level: 1, name: "builds" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "diffs" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: /highlight/i })).toHaveTextContent("exact");
  });

  it("should show a not found page for non-admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "reviewer" }),
      session: mocks.session.generateSession(),
    });

    render(await SettingsBuildsPage());

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should show an error page when the diff settings cannot be retrieved", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetDiffSettings.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);

    await expect(SettingsBuildsPage()).rejects.toThrow();
  });
});
