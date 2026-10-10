import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { test as vitest } from "vitest";

export { describe, expect, vi } from "vitest";

type UnresponsiveServer = {
  url: string;
  requestCount: () => number;
};

type UnknownProcedureServer = {
  url: string;
  requestCount: () => number;
};

type Fixtures = {
  unresponsiveServer: UnresponsiveServer;
  unknownProcedureServer: UnknownProcedureServer;
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
  // eslint-disable-next-line no-empty-pattern
  unknownProcedureServer: async ({}, use) => {
    let requests = 0;
    const server = createServer((_, response) => {
      requests += 1;
      response.writeHead(404, { "x-ovr-version": "0.10.0" }).end();
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;

    await use({ url: `http://127.0.0.1:${port}`, requestCount: () => requests });

    await new Promise<void>((resolve) => server.close(() => resolve()));
  },
});
