import { randomBytes } from "node:crypto";

import { test as vitest, vi } from "vitest";

import { metricsFixture, type TestMetrics } from "@ovr/metrics/testing";

export { describe, expect } from "vitest";

type Fixtures = {
  metrics: TestMetrics;
  encryptionKey: string;
};

export const test = vitest.extend<Fixtures>({
  metrics: metricsFixture,

  // eslint-disable-next-line no-empty-pattern
  encryptionKey: async ({}, use) => {
    const key = randomBytes(32).toString("base64");
    vi.stubEnv("OVR_GIT_TOKEN_ENCRYPTION_KEY", key);
    await use(key);
  },
});
