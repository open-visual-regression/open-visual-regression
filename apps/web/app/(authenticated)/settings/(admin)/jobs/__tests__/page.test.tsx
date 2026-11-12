import { notFound } from "next/navigation";
import { vi } from "vitest";

import { DEFAULT_FLAKY_DETECTION_SETTINGS } from "@ovr/api/contracts/jobs";
import { mocks } from "@ovr/mocks";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen } from "@/test-utils";

import SettingsJobsPage from "../page";

vi.mock("next/headers");
vi.mock("next/navigation");
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/router");

const mockGetSession = vi.mocked(auth.api.getSession);
const mockGetFlakyDetection = vi.mocked(serverClient.jobs.getFlakyDetection);
const mockNotFound = vi.mocked(notFound);

describe("SettingsJobsPage", () => {
  it("should show the flaky detection settings for admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetFlakyDetection.mockResolvedValue([
      null,
      {
        settings: { ...DEFAULT_FLAKY_DETECTION_SETTINGS, enabled: true },
        lastRunAt: null,
        nextRunAt: null,
        running: false,
      },
    ]);

    render(await SettingsJobsPage());

    expect(screen.getByRole("heading", { name: /^jobs$/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /flaky detection/i })).toBeVisible();
    expect(screen.getByRole("switch", { name: /enabled/i })).toBeChecked();
  });

  it("should show when flaky detection last ran and next runs", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetFlakyDetection.mockResolvedValue([
      null,
      {
        settings: { ...DEFAULT_FLAKY_DETECTION_SETTINGS, enabled: true },
        lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        nextRunAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        running: false,
      },
    ]);

    render(await SettingsJobsPage());

    expect(screen.getByText("last run: 2 hours ago · next run: in 3 hours")).toBeVisible();
  });

  it("should not show a next run when flaky detection is not scheduled", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetFlakyDetection.mockResolvedValue([
      null,
      {
        settings: DEFAULT_FLAKY_DETECTION_SETTINGS,
        lastRunAt: null,
        nextRunAt: null,
        running: false,
      },
    ]);

    render(await SettingsJobsPage());

    expect(screen.getByText("last run: never")).toBeVisible();
  });

  it("should show a not found page for non-admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "reviewer" }),
      session: mocks.session.generateSession(),
    });

    render(await SettingsJobsPage());

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should show an error page when the flaky detection settings cannot be retrieved", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetFlakyDetection.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);

    await expect(SettingsJobsPage()).rejects.toThrow();
  });
});
