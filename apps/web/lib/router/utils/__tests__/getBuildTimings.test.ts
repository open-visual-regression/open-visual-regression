import { describe, expect, it } from "@/test-utils";

import { getBuildTimings } from "../buildTimings";

const CREATED_AT = "2026-01-01T00:00:00.000Z";
const STARTED_AT = "2026-01-01T00:00:12.000Z";
const COMPLETED_AT = "2026-01-01T00:02:14.500Z";

const NO_TIMINGS = { queuedMs: null, processingMs: null, durationMs: null };

describe("getBuildTimings", () => {
  it("should report nothing while the build is queued", () => {
    expect(
      getBuildTimings({
        processingStatus: "queued",
        createdAt: CREATED_AT,
        startedAt: null,
        completedAt: null,
      }),
    ).toEqual(NO_TIMINGS);
  });

  it("should report nothing while the build is processing", () => {
    expect(
      getBuildTimings({
        processingStatus: "processing",
        createdAt: CREATED_AT,
        startedAt: STARTED_AT,
        completedAt: null,
      }),
    ).toEqual(NO_TIMINGS);
  });

  it("should report nothing while rebuilt snapshots process, despite earlier timings", () => {
    expect(
      getBuildTimings({
        processingStatus: "processing",
        createdAt: CREATED_AT,
        startedAt: STARTED_AT,
        completedAt: COMPLETED_AT,
      }),
    ).toEqual(NO_TIMINGS);
  });

  it.for(["success", "error", "canceled"] as const)(
    "should report queue, processing, and total time once the build finishes as %s",
    (processingStatus) => {
      expect(
        getBuildTimings({
          processingStatus,
          createdAt: CREATED_AT,
          startedAt: STARTED_AT,
          completedAt: COMPLETED_AT,
        }),
      ).toEqual({ queuedMs: 12_000, processingMs: 122_500, durationMs: 134_500 });
    },
  );

  it("should count a build that finished before it started as all queue time", () => {
    expect(
      getBuildTimings({
        processingStatus: "canceled",
        createdAt: CREATED_AT,
        startedAt: null,
        completedAt: STARTED_AT,
      }),
    ).toEqual({ queuedMs: 12_000, processingMs: null, durationMs: 12_000 });
  });

  it("should report nothing for builds finished before timings were recorded", () => {
    expect(
      getBuildTimings({
        processingStatus: "success",
        createdAt: CREATED_AT,
        startedAt: null,
        completedAt: null,
      }),
    ).toEqual(NO_TIMINGS);
  });
});
