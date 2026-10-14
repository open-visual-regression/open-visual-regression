import { vi } from "vitest";

import { describe, expect, test } from "@/lib/testing/fixtures";

import { auth, LOCAL_AUTH_PATHS } from "../auth";

vi.mock("@/lib/auth/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/config")>()),
  usesTrustedProxy: () => true,
}));

const BASE_URL = "http://localhost:3000/api/auth";

describe("auth with a trusted proxy", () => {
  test.for(LOCAL_AUTH_PATHS)("should not serve %s", async (path) => {
    const response = await auth.handler(
      new Request(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: "{}",
      }),
    );

    expect(response.status).toBe(404);
  });

  test("should still serve the session", async () => {
    const response = await auth.handler(new Request(`${BASE_URL}/get-session`));

    expect(response.status).toBe(200);
  });
});
