import { test as vitest } from "vitest";

import { metricsFixture, type TestMetrics } from "@ovr/metrics/testing";

export { describe, expect } from "vitest";

type Fixtures = {
  metrics: TestMetrics;
};

export const test = vitest.extend<Fixtures>({
  metrics: metricsFixture,
});
