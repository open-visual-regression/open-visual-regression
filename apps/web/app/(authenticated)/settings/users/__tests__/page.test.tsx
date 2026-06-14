import { vi } from "vitest";

import { describe, expect, it, render, screen } from "@/test-utils";
import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { mocks } from "@ovr/mocks";
import { notFound } from "next/navigation";
import { createORPCError } from "@/lib/testing/orpc";
import SettingsUsersPage from "../page";

vi.mock("next/headers");
vi.mock("next/navigation");
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/router");

const mockGetSession = vi.mocked(auth.api.getSession);
const mockListUsers = vi.mocked(serverClient.users.list);
const mockNotFound = vi.mocked(notFound);

describe("SettingsUsersPage", () => {
  it("should show the users table for admins", async () => {
    const users = [
      mocks.user.generateUserSchema({ name: "ari shapiro" }),
      mocks.user.generateUserSchema({ name: "sam chen" }),
    ];
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockListUsers.mockResolvedValue([null, { users }]);

    render(await SettingsUsersPage());

    expect(screen.getByRole("heading", { name: /users/i })).toBeVisible();
    expect(screen.getByRole("cell", { name: "ari shapiro" })).toBeVisible();
    expect(screen.getByRole("cell", { name: "sam chen" })).toBeVisible();
  });

  it("should show a not found page for non-admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser({ role: "user" }),
      session: mocks.session.generateSession(),
    });

    render(await SettingsUsersPage());

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should show an error page when the session cannot be retrieved", async () => {
    mockGetSession.mockRejectedValue(new Error("DB connection failed"));

    await expect(SettingsUsersPage()).rejects.toThrow();
  });

  it("should show an error page when the users cannot be retrieved", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockListUsers.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);

    await expect(SettingsUsersPage()).rejects.toThrow();
  });
});
