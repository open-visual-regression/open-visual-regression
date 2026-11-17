import { notFound } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen } from "@/test-utils";

import SettingsDiffsPage from "../page";

vi.mock("next/headers");
vi.mock("next/server");
vi.mock("next/navigation");
vi.mock("@/lib/auth/auth");
vi.mock("@/lib/router");

const mockGetSession = vi.mocked(auth.api.getSession);
const mockGetDiff = vi.mocked(serverClient.settings.getDiff);
const mockNotFound = vi.mocked(notFound);

describe("SettingsDiffsPage", () => {
  it("should show the saved diff algorithm for admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetDiff.mockResolvedValue([null, { settings: { algorithm: "pixel" } }]);

    render(await SettingsDiffsPage());

    expect(screen.getByRole("heading", { name: /^diffs$/i })).toBeVisible();
    expect(screen.getByRole("combobox", { name: /algorithm/i })).toHaveTextContent(
      "pixel by pixel",
    );
  });

  it("should show a not found page for non-admins", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "reviewer" }),
      session: mocks.session.generateSession(),
    });

    render(await SettingsDiffsPage());

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should show an error page when the diff settings cannot be retrieved", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateAuthUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });
    mockGetDiff.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);

    await expect(SettingsDiffsPage()).rejects.toThrow();
  });
});
