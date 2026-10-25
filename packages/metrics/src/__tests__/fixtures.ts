import { test as vitest } from "vitest";

import { startMetrics, type Metrics } from "../server";

export { describe, expect } from "vitest";

type Fixtures = {
  metrics: Metrics;
  scrape: (path?: string) => Promise<Response>;
};

export const test = vitest.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  metrics: async ({}, use) => {
    const metrics = await startMetrics({ serviceName: "ovr-test", port: 0, host: "127.0.0.1" });
    await use(metrics!);
    await metrics!.shutdown();
  },

  scrape: async ({ metrics }, use) => {
    await use((path = "/metrics") => fetch(`http://127.0.0.1:${metrics.port}${path}`));
  },
});
