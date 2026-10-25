import type { BuildDbSchema } from "@ovr/db/repository/builds";

type BuildTimings = {
  queuedMs: number | null;
  processingMs: number | null;
  durationMs: number | null;
};

const elapsedMs = (from: string | null, to: string | null): number | null => {
  if (!from || !to) {
    return null;
  }

  const ms = Math.round(Date.parse(to) - Date.parse(from));
  return ms > 0 ? ms : null;
};

const NO_TIMINGS: BuildTimings = { queuedMs: null, processingMs: null, durationMs: null };

// Reports nothing while the build is in progress, including while rebuilt snapshots run again.
export const getBuildTimings = (
  build: Pick<
    NonNullable<BuildDbSchema>,
    "processingStatus" | "createdAt" | "startedAt" | "completedAt"
  >,
): BuildTimings => {
  if (build.processingStatus === "queued" || build.processingStatus === "processing") {
    return NO_TIMINGS;
  }

  return {
    queuedMs: elapsedMs(build.createdAt, build.startedAt ?? build.completedAt),
    processingMs: elapsedMs(build.startedAt, build.completedAt),
    durationMs: elapsedMs(build.createdAt, build.completedAt),
  };
};
