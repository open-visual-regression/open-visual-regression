import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createClient, RequestTimeoutError } from "../client";

describe("createClient", () => {
  let server: Server;
  let requests: number;

  beforeEach(async () => {
    requests = 0;
    server = createServer(() => {
      requests += 1;
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  });

  afterEach(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("should time out a request the server never answers and report each retry", async () => {
    const onError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { port } = server.address() as AddressInfo;
    const client = createClient(`http://127.0.0.1:${port}`, "key", 100);

    await expect(
      client.builds.createBuild({ branch: "main", commitSha: "a".repeat(40) }),
    ).rejects.toBeInstanceOf(RequestTimeoutError);

    expect(requests).toBe(4);
    expect(onError).toHaveBeenCalledWith(
      "Request to builds.createBuild failed (no response after 0.1s), retrying (1/3)...",
    );
  }, 20_000);
});
