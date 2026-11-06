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

export type CapturePhase = "render" | "settle" | "wait" | "screenshot" | "upload";

export const snapshotCapturePhaseDuration = createHistogram<{
  browser: string;
  phase: CapturePhase;
}>("ovr.snapshot.capture.phase.duration.seconds", {
  description:
    "Time each phase of a successful snapshot capture took. wait is the story's waitForTimeout.",
  unit: "s",
  buckets: DURATION_BUCKETS_SECONDS,
});

// timed_out: the settle budget ran out with requests, images or DOM changes still pending.
export const snapshotsSettled = createCounter<{ outcome: "quiet" | "timed_out" }>(
  "ovr.snapshots.settled",
  { description: "Snapshots that finished settling, by whether the page went quiet in time." },
);

export const capturePageBootDuration = createHistogram<{ browser: string }>(
  "ovr.capture.page.boot.duration.seconds",
  {
    description:
      "Time to open a page and load Storybook in a new capture browser, once per capture group.",
    unit: "s",
    buckets: DURATION_BUCKETS_SECONDS,
  },
);

export const snapshotsCreated = createCounter<{ status: "queued" | "skipped" }>(
  "ovr.snapshots.created",
  {
    description:
      "Snapshots a build created, by whether they will be captured or keep their baseline because their story was unaffected.",
  },
);

export const browserRelaunches = createCounter<{ browser: string; reason: "timeout" | "closed" }>(
  "ovr.capture.browser.relaunches",
  { description: "Capture browsers relaunched mid-group after a timeout or an unexpected close." },
);

export const diffsCompared = createCounter<{ result: DiffResult }>("ovr.diffs.compared", {
  description: "Snapshots compared against their baseline, by result.",
});
