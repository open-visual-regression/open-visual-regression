import { vi } from "vitest";

import { SERVER_VERSION_HEADER } from "@ovr/api/contracts/contract";

import { describe, expect, test } from "@/lib/testing/fixtures";
import { APP_VERSION } from "@/lib/utils/version";

import { POST } from "../route";

vi.mock("next/headers");

const callProcedure = (path: string) =>
  POST(
    new Request(`http://localhost/api/rpc/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }),
  );

describe("POST /api/rpc/[...path]", () => {
  test("should report the server version on a procedure's response", async () => {
    const response = await callProcedure("health/live");

    expect(response.status).toBe(200);
    expect(response.headers.get(SERVER_VERSION_HEADER)).toBe(APP_VERSION);
  });

  test("should report the server version on an unknown procedure", async () => {
    const response = await callProcedure("snapshots/doesNotExist");

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toBeNull();
    expect(response.headers.get(SERVER_VERSION_HEADER)).toBe(APP_VERSION);
  });
});
