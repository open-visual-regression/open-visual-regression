import { createClient, RequestTimeoutError } from "../client";
import { UnsupportedByServerError } from "../errors";
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

  test("should fail without retrying when the server does not have the procedure", async ({
    unknownProcedureServer,
  }) => {
    const client = createClient(unknownProcedureServer.url, "key");

    const request = client.snapshots.getOne({ snapshotId: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb" });

    await expect(request).rejects.toBeInstanceOf(UnsupportedByServerError);
    await expect(request).rejects.toMatchObject({ serverVersion: "0.10.0" });
    expect(unknownProcedureServer.requestCount()).toBe(1);
  });
});
