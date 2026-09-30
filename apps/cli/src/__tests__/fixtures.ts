import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { test as vitest } from "vitest";

export { describe, expect, vi } from "vitest";

type UnresponsiveServer = {
  url: string;
  requestCount: () => number;
};

type Fixtures = {
  unresponsiveServer: UnresponsiveServer;
};

export const test = vitest.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  unresponsiveServer: async ({}, use) => {
    let requests = 0;
    const server = createServer(() => {
      requests += 1;
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;

    await use({ url: `http://127.0.0.1:${port}`, requestCount: () => requests });

    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  },
});
