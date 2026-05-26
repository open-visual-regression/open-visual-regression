import { vi, describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { proxy } from "@/proxy";

vi.mock("@/lib/auth");

const mockGetSession = vi.mocked(auth.api.getSession);

const makeRequest = (path: string, cookies: Record<string, string> = {}) => {
  const cookieHeader = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  return new NextRequest(`http://localhost${path}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
};

const SETUP_COOKIE = { ovr_setup_complete: "1" };

describe("proxy", () => {
  it("should pass through /api/auth/** regardless of cookie or session", async () => {
    const res = await proxy(makeRequest("/api/auth/sign-in/email"));
    expect(res.headers.get("location")).toBeNull();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it("should pass through /api/rpc/** regardless of cookie or session", async () => {
    const res = await proxy(makeRequest("/api/rpc/setup/getUserCount"));
    expect(res.headers.get("location")).toBeNull();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it("should pass through /_next/** regardless of cookie or session", async () => {
    const res = await proxy(makeRequest("/_next/data/build-id/index.json"));
    expect(res.headers.get("location")).toBeNull();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it("should redirect to /setup when cookie is absent and path is protected", async () => {
    const res = await proxy(makeRequest("/projects"));
    expect(res.headers.get("location")).toMatch(/\/setup$/);
  });

  it("should redirect to /setup when cookie is absent and path is /login", async () => {
    const res = await proxy(makeRequest("/login"));
    expect(res.headers.get("location")).toMatch(/\/setup$/);
  });

  it("should not redirect when cookie is absent and already on /setup", async () => {
    const res = await proxy(makeRequest("/setup"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("should redirect to /login when cookie present but no session on protected path", async () => {
    const res = await proxy(makeRequest("/projects", SETUP_COOKIE));
    expect(res.headers.get("location")).toMatch(/\/login$/);
  });

  it("should not check session when on /login", async () => {
    const res = await proxy(makeRequest("/login", SETUP_COOKIE));
    expect(res.headers.get("location")).toBeNull();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it("should not check session when on /setup", async () => {
    const res = await proxy(makeRequest("/setup", SETUP_COOKIE));
    expect(res.headers.get("location")).toBeNull();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it("should not check session when on /invite/**", async () => {
    const res = await proxy(makeRequest("/invite/abc-123", SETUP_COOKIE));
    expect(res.headers.get("location")).toBeNull();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it("should pass through when cookie present and session is valid", async () => {
    mockGetSession.mockResolvedValue({
      session: { id: "s1", userId: "u1" },
      user: { id: "u1", email: "user@example.com" },
    } as never);
    const res = await proxy(makeRequest("/projects", SETUP_COOKIE));
    expect(res.headers.get("location")).toBeNull();
  });
});
