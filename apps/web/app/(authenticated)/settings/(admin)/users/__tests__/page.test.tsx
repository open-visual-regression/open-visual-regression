import { notFound } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen } from "@/test-utils";

import SettingsUsersPage, { type SettingsUsersPageProps } from "../page";

vi.mock("next/headers");
vi.mock("next/navigation");
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/router");

const mockGetSession = vi.mocked(auth.api.getSession);
const mockListUsers = vi.mocked(serverClient.users.list);
const mockNotFound = vi.mocked(notFound);

const pageProps: SettingsUsersPageProps = {
  searchParams: Promise.resolve({}),
};

describe("SettingsUsersPage", () => {
  it("should show the users table for admins", async () => {
    const users = [
      mocks.user.generateUser({ name: "ari shapiro" }),
      mocks.user.generateUser({ name: "sam chen" }),
    ];
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockListUsers.mockResolvedValue([null, { users, total: users.length }]);

    render(await SettingsUsersPage(pageProps));

    expect(screen.getByRole("heading", { name: /users/i })).toBeVisible();
    expect(screen.getByRole("cell", { name: "ari shapiro" })).toBeVisible();
    expect(screen.getByRole("cell", { name: "sam chen" })).toBeVisible();
  });

  it("should pass the search query through to the users list", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockListUsers.mockResolvedValue([null, { users: [], total: 0 }]);

    render(await SettingsUsersPage({ searchParams: Promise.resolve({ search: "ari" }) }));

    expect(mockListUsers).toHaveBeenCalledWith({ search: "ari" });
  });

  it("should show a not found page for non-admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "user" }),
      session: mocks.session.generateSession(),
    });

    render(await SettingsUsersPage(pageProps));

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should show an error page when the session cannot be retrieved", async () => {
    mockGetSession.mockRejectedValue(new Error("DB connection failed"));

    await expect(SettingsUsersPage(pageProps)).rejects.toThrow();
  });

  it("should show an error page when the users cannot be retrieved", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockListUsers.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);

    await expect(SettingsUsersPage(pageProps)).rejects.toThrow();
  });
});
