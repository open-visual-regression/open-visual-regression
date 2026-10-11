import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { test as vitest } from "vitest";

export { describe, expect, vi } from "vitest";

type UnresponsiveServer = {
  url: string;
  requestCount: () => number;
};

type StorageServer = {
  url: string;
};

type UnknownProcedureServer = {
  url: string;
  requestCount: () => number;
};

type Fixtures = {
  unresponsiveServer: UnresponsiveServer;
  storageServer: StorageServer;
  unknownProcedureServer: UnknownProcedureServer;
};

const STORAGE_IMAGES = new Map([
  ["/project/baseline.png", "baseline image"],
  ["/project/diff.png", "diff image"],
  ["/project/new.png", "new image"],
]);

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
  storageServer: async ({}, use) => {
    const server = createServer((request, response) => {
      const image = STORAGE_IMAGES.get(request.url ?? "");
      response.writeHead(image ? 200 : 404, { "content-type": "image/png" }).end(image);
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;

    await use({ url: `http://127.0.0.1:${port}` });

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
