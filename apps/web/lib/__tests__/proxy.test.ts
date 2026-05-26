import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

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
  it("should pass through /api/auth/** without checking setup cookie", async () => {
    const res = await proxy(makeRequest("/api/auth/sign-in/email"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("should pass through /api/rpc/** without checking setup cookie", async () => {
    const res = await proxy(makeRequest("/api/rpc/setup/getUserCount"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("should pass through /_next/** without checking setup cookie", async () => {
    const res = await proxy(makeRequest("/_next/data/build-id/index.json"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("should redirect to /setup when cookie is absent and path is protected", async () => {
    const res = await proxy(makeRequest("/projects"));
    expect(res.headers.get("location")).toMatch(/\/setup$/);
  });

  it("should not redirect when cookie is absent and already on /setup", async () => {
    const res = await proxy(makeRequest("/setup"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("should pass through when setup cookie is present", async () => {
    const res = await proxy(makeRequest("/projects", SETUP_COOKIE));
    expect(res.headers.get("location")).toBeNull();
  });
});
