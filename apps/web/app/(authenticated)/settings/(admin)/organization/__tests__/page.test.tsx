import { notFound } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen } from "@/test-utils";

import SettingsOrganizationPage from "../page";

vi.mock("next/headers");
vi.mock("next/navigation");
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/router");

const mockGetSession = vi.mocked(auth.api.getSession);
const mockGetOrganization = vi.mocked(serverClient.organizations.getOne);
const mockNotFound = vi.mocked(notFound);

describe("SettingsOrganizationPage", () => {
  it("should show the organization form prefilled with the organization name for admins", async () => {
    const organization = mocks.organization.generateOrganization({ name: "Acme Inc" });
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetOrganization.mockResolvedValue([null, { organization }]);

    render(await SettingsOrganizationPage());

    expect(screen.getByRole("heading", { name: /organization/i })).toBeVisible();
    expect(screen.getByDisplayValue("Acme Inc")).toBeVisible();
  });

  it("should show a not found page for non-admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "reviewer" }),
      session: mocks.session.generateSession(),
    });

    render(await SettingsOrganizationPage());

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should show an error page when the session cannot be retrieved", async () => {
    mockGetSession.mockRejectedValue(new Error("DB connection failed"));

    await expect(SettingsOrganizationPage()).rejects.toThrow();
  });

  it("should show an error page when the organization cannot be retrieved", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetOrganization.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);

    await expect(SettingsOrganizationPage()).rejects.toThrow();
  });
});
