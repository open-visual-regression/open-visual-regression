import { expect, test, vi } from "vitest";

import { requestTimeoutMs } from "../lib/captureTimeouts";

test("waits 5 seconds for a request by default", () => {
  expect(requestTimeoutMs()).toBe(5_000);
});

test("falls back to the default when OVR_CAPTURE_REQUEST_TIMEOUT_MS is not a positive integer", () => {
  vi.stubEnv("OVR_CAPTURE_REQUEST_TIMEOUT_MS", "soon");

  expect(requestTimeoutMs()).toBe(5_000);
});
