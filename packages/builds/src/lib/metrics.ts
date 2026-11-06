import type { BuildType } from "@ovr/db/schema";
import { createCounter, createHistogram, DURATION_BUCKETS_SECONDS } from "@ovr/metrics";

export type BuildTrigger = "upload" | "rebuild";

export type FinishedBuildStatus = "success" | "error" | "canceled";

export type BuildFinishReason =
  | "finalized"
  | "canceled"
  | "superseded"
  | "timed_out"
  | "extract_failed"
  | "finalize_failed"
  | "enqueue_failed";

// A few size ranges, never the count itself, so each range stays one series.
export type BuildSize = "under_100" | "100_to_499" | "500_to_999" | "1000_or_more";

export const toBuildSize = (snapshots: number): BuildSize => {
  if (snapshots < 100) {
    return "under_100";
  }
  if (snapshots < 500) {
    return "100_to_499";
  }
  return snapshots < 1000 ? "500_to_999" : "1000_or_more";
};

export const buildsCreated = createCounter<{ build_type: BuildType; trigger: BuildTrigger }>(
  "ovr.builds.created",
  { description: "Builds created, from an upload or a rebuild of an earlier build." },
);

export const buildsFinished = createCounter<{
  processing_status: FinishedBuildStatus;
  reason: BuildFinishReason;
}>("ovr.builds.finished", {
  description: "Builds that stopped processing, by final status and why.",
});

export const buildDuration = createHistogram<{
  processing_status: FinishedBuildStatus;
  size: BuildSize;
}>("ovr.build.duration.seconds", {
  description:
    "Time from a build's creation until it finalized, by how many snapshots it captured.",
  unit: "s",
  buckets: DURATION_BUCKETS_SECONDS,
});

export const buildCaptureWait = createHistogram<{ size: BuildSize }>(
  "ovr.build.capture.wait.seconds",
  {
    description:
      "Time from a build's capture groups being queued until its first snapshot started capturing, by how many snapshots it captures.",
    unit: "s",
    buckets: DURATION_BUCKETS_SECONDS,
  },
);
