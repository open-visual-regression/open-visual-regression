import { createCounter, createHistogram, DURATION_BUCKETS_SECONDS } from "@ovr/metrics";

// `new`: no baseline yet.
export type DiffResult = "unchanged" | "changed" | "new" | "error";

export const snapshotsCaptured = createCounter<{ browser: string; outcome: "success" | "error" }>(
  "ovr.snapshots.captured",
  { description: "Snapshots whose capture finished, by browser and outcome." },
);

export const snapshotCaptureDuration = createHistogram<{ browser: string }>(
  "ovr.snapshot.capture.duration.seconds",
  {
    description: "Time to render, settle, screenshot, and upload one snapshot.",
    unit: "s",
    buckets: DURATION_BUCKETS_SECONDS,
  },
);

export const browserRelaunches = createCounter<{ browser: string; reason: "timeout" | "closed" }>(
  "ovr.capture.browser.relaunches",
  { description: "Capture browsers relaunched mid-group after a timeout or an unexpected close." },
);

export const diffsCompared = createCounter<{ result: DiffResult }>("ovr.diffs.compared", {
  description: "Snapshots compared against their baseline, by result.",
});
