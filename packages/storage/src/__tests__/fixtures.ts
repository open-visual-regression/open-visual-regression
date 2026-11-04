import { test as vitest } from "vitest";

import { metricsFixture, type TestMetrics } from "@ovr/metrics/testing";

import { storage } from "../index";

export { describe, expect } from "vitest";

type Fixtures = {
  key: string;
  prefix: string;
  metrics: TestMetrics;
};

export const test = vitest.extend<Fixtures>({
  metrics: metricsFixture,

  // eslint-disable-next-line no-empty-pattern
  key: async ({}, use) => {
    const key = `test/${crypto.randomUUID()}.png`;
    await use(key);
    await storage.deleteFile(key);
  },

  // eslint-disable-next-line no-empty-pattern
  prefix: async ({}, use) => {
    const prefix = `test/${crypto.randomUUID()}/`;
    await use(prefix);
    await storage.deletePrefix(prefix);
  },
});
