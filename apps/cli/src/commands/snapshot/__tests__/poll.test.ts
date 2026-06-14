import { describe, expect, it, vi } from "vitest";
import type { OvrClient } from "../../../client";
import {
  BuildFailedError,
  BuildNeedsReviewError,
  BuildTimeoutError,
  pollBuildStatus,
} from "../poll";

type GetBuildStatus = OvrClient["builds"]["getBuildStatus"];

describe("pollBuildStatus", () => {
  it("should resolve when the build passes", async () => {
    const getBuildStatus = vi.fn<GetBuildStatus>().mockResolvedValue({ status: "passed" });

    await expect(
      pollBuildStatus({
        client: { builds: { getBuildStatus } },
        buildId: "build-1",
        timeoutSeconds: 10,
        pollIntervalMs: 1,
      }),
    ).resolves.toBeUndefined();
  });

  it("should reject with the review URL when the build needs review", async () => {
    const getBuildStatus = vi
      .fn<GetBuildStatus>()
      .mockResolvedValue({ status: "needs_review", reviewUrl: "https://ovr.example/review/1" });

    const promise = pollBuildStatus({
      client: { builds: { getBuildStatus } },
      buildId: "build-1",
      timeoutSeconds: 10,
      pollIntervalMs: 1,
    });

    await expect(promise).rejects.toBeInstanceOf(BuildNeedsReviewError);
    await expect(promise).rejects.toMatchObject({ reviewUrl: "https://ovr.example/review/1" });
  });

  it("should reject when the build errors", async () => {
    const getBuildStatus = vi.fn<GetBuildStatus>().mockResolvedValue({ status: "error" });

    await expect(
      pollBuildStatus({
        client: { builds: { getBuildStatus } },
        buildId: "build-1",
        timeoutSeconds: 10,
        pollIntervalMs: 1,
      }),
    ).rejects.toBeInstanceOf(BuildFailedError);
  });

  it("should reject with a timeout message when the deadline is exceeded", async () => {
    const getBuildStatus = vi.fn<GetBuildStatus>().mockResolvedValue({ status: "pending" });

    await expect(
      pollBuildStatus({
        client: { builds: { getBuildStatus } },
        buildId: "build-1",
        timeoutSeconds: 0,
        pollIntervalMs: 1,
      }),
    ).rejects.toThrow(new BuildTimeoutError(0).message);
  });
});
