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

export const buildDuration = createHistogram<{ processing_status: FinishedBuildStatus }>(
  "ovr.build.duration.seconds",
  {
    description: "Time from a build's creation until it finalized.",
    unit: "s",
    buckets: DURATION_BUCKETS_SECONDS,
  },
);
