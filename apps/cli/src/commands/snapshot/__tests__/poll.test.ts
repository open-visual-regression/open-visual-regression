import { describe, expect, it, vi } from "vitest";
import type { OvrClient } from "../../../client";
import {
  BuildFailedError,
  BuildNeedsReviewError,
  BuildTimeoutError,
  pollBuildStatus,
} from "../poll";

type GetBuildStatus = OvrClient["builds"]["getBuildStatus"];

const createClient = (getBuildStatus: GetBuildStatus): OvrClient =>
  ({ builds: { getBuildStatus } }) as unknown as OvrClient;

describe("pollBuildStatus", () => {
  it("resolves when the build passes", async () => {
    const getBuildStatus = vi.fn<GetBuildStatus>().mockResolvedValue({ status: "passed" });
    const client = createClient(getBuildStatus);

    await expect(
      pollBuildStatus({ client, buildId: "build-1", timeoutSeconds: 10, pollIntervalMs: 1 }),
    ).resolves.toBeUndefined();
  });

  it("rejects with the review URL when the build needs review", async () => {
    const getBuildStatus = vi
      .fn<GetBuildStatus>()
      .mockResolvedValue({ status: "needs_review", reviewUrl: "https://ovr.example/review/1" });
    const client = createClient(getBuildStatus);

    const error = await pollBuildStatus({
      client,
      buildId: "build-1",
      timeoutSeconds: 10,
      pollIntervalMs: 1,
    }).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(BuildNeedsReviewError);
    expect((error as BuildNeedsReviewError).reviewUrl).toBe("https://ovr.example/review/1");
  });

  it("rejects when the build errors", async () => {
    const getBuildStatus = vi.fn<GetBuildStatus>().mockResolvedValue({ status: "error" });
    const client = createClient(getBuildStatus);

    await expect(
      pollBuildStatus({ client, buildId: "build-1", timeoutSeconds: 10, pollIntervalMs: 1 }),
    ).rejects.toBeInstanceOf(BuildFailedError);
  });

  it("rejects with a timeout message when the deadline is exceeded", async () => {
    const getBuildStatus = vi.fn<GetBuildStatus>().mockResolvedValue({ status: "pending" });
    const client = createClient(getBuildStatus);

    await expect(
      pollBuildStatus({ client, buildId: "build-1", timeoutSeconds: 0, pollIntervalMs: 1 }),
    ).rejects.toThrow(new BuildTimeoutError(0).message);
  });
});
