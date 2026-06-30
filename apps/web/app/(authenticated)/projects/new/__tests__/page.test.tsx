import { notFound } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { auth } from "@/lib/auth/auth";
import { describe, expect, it, render, screen } from "@/test-utils";

import CreateProjectPage from "../page";

vi.mock("next/headers");
vi.mock("next/navigation");
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/router");

const mockGetSession = vi.mocked(auth.api.getSession);
const mockNotFound = vi.mocked(notFound);

describe("CreateProjectPage", () => {
  it("should show the new project form for admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });

    render(await CreateProjectPage());

    expect(screen.getByRole("heading", { name: /new project/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /create project/i })).toBeVisible();
  });

  it("should show a not found page for non-admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "user" }),
      session: mocks.session.generateSession(),
    });

    render(await CreateProjectPage());

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should show an error page when the session cannot be retrieved", async () => {
    mockGetSession.mockRejectedValue(new Error("DB connection failed"));

    await expect(CreateProjectPage()).rejects.toThrow();
  });
});
