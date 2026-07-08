import { describe, expect, it, vi } from "vitest";

import type { OvrClient } from "../../../client";
import {
  BuildCanceledError,
  BuildFailedError,
  BuildNeedsReviewError,
  BuildRejectedError,
  BuildTimeoutError,
  pollBuildStatus,
} from "../poll";

type GetBuildStatus = OvrClient["builds"]["getBuildStatus"];

describe("pollBuildStatus", () => {
  it("should resolve when the build is unchanged", async () => {
    const getBuildStatus = vi.fn<GetBuildStatus>().mockResolvedValue({ status: "unchanged" });

    await expect(
      pollBuildStatus({
        client: { builds: { getBuildStatus } },
        buildId: "build-1",
        timeoutSeconds: 10,
        pollIntervalMs: 1,
      }),
    ).resolves.toBeUndefined();
  });

  it("should resolve when the build is auto approved", async () => {
    const getBuildStatus = vi.fn<GetBuildStatus>().mockResolvedValue({ status: "auto_approved" });

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

  it("should reject when the build is rejected", async () => {
    const getBuildStatus = vi.fn<GetBuildStatus>().mockResolvedValue({ status: "rejected" });

    await expect(
      pollBuildStatus({
        client: { builds: { getBuildStatus } },
        buildId: "build-1",
        timeoutSeconds: 10,
        pollIntervalMs: 1,
      }),
    ).rejects.toBeInstanceOf(BuildRejectedError);
  });

  it("should reject when the build is canceled", async () => {
    const getBuildStatus = vi.fn<GetBuildStatus>().mockResolvedValue({ status: "canceled" });

    await expect(
      pollBuildStatus({
        client: { builds: { getBuildStatus } },
        buildId: "build-1",
        timeoutSeconds: 10,
        pollIntervalMs: 1,
      }),
    ).rejects.toBeInstanceOf(BuildCanceledError);
  });

  it("should reject with a timeout message when the deadline is exceeded", async () => {
    const getBuildStatus = vi.fn<GetBuildStatus>().mockResolvedValue({ status: "queued" });

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
