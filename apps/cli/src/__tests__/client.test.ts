import { createClient, RequestTimeoutError } from "../client";
import { describe, expect, test, vi } from "./fixtures";

describe("createClient", () => {
  test("should time out a request the server never answers and report each retry", async ({
    unresponsiveServer,
  }) => {
    const onError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const client = createClient(unresponsiveServer.url, "key", 100);

    await expect(
      client.builds.createBuild({ branch: "main", commitSha: "a".repeat(40) }),
    ).rejects.toBeInstanceOf(RequestTimeoutError);

    expect(unresponsiveServer.requestCount()).toBe(4);
    expect(onError).toHaveBeenCalledWith(
      "Request to builds.createBuild failed (no response after 0.1s), retrying (1/3)...",
    );
  }, 20_000);
});
