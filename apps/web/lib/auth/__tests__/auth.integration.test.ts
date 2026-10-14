import { vi } from "vitest";

import { describe, expect, test } from "@/lib/testing/fixtures";

import { auth, LOCAL_AUTH_PATHS } from "../auth";

vi.mock("@/lib/auth/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/config")>()),
  usesTrustedProxy: () => true,
}));

const BASE_URL = "http://localhost:3000/api/auth";

describe("auth with a trusted proxy", () => {
  test("should only disable routes that better-auth serves", () => {
    const paths = Object.values(auth.api).map((endpoint) => endpoint.path);

    expect(paths).toEqual(expect.arrayContaining([...LOCAL_AUTH_PATHS]));
  });

  test("should not serve password sign-in", async () => {
    const response = await auth.handler(
      new Request(`${BASE_URL}/sign-in/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({ email: "admin@example.com", password: "securepass123" }),
      }),
    );

    expect(response.status).toBe(404);
  });

  test("should still serve the session", async () => {
    const response = await auth.handler(new Request(`${BASE_URL}/get-session`));

    expect(response.status).toBe(200);
  });
});
