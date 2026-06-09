import { vi } from "vitest";

import { describe, expect, it } from "@/test-utils";
import { auth } from "@/lib/auth/auth";
import { mocks } from "@ovr/mocks";
import { verifyRole } from "../authorization";

vi.mock("next/headers");
vi.mock("@/lib/auth/auth");

const mockGetSession = vi.mocked(auth.api.getSession);

describe("verifyRole", () => {
  it("should grant access when the user has the required role", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser({ role: "admin" }),
      session: mocks.session.generateSession(),
    });

    const result = await verifyRole("admin");

    expect(result).toEqual({ status: "ok", data: true });
  });

  it("should deny access when the user does not have the required role", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser({ role: "user" }),
      session: mocks.session.generateSession(),
    });

    const result = await verifyRole("admin");

    expect(result).toEqual({ status: "ok", data: false });
  });

  it("should deny access when the user is not logged in", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await verifyRole("admin");

    expect(result).toEqual({ status: "ok", data: false });
  });

  it("should return an error when the session cannot be retrieved", async () => {
    mockGetSession.mockRejectedValue(new Error("DB connection failed"));

    const result = await verifyRole("admin");

    expect(result).toEqual({ status: "error", error: "DB connection failed" });
  });
});
