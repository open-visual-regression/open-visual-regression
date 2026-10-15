import type { SnapshotDbSchema } from "@ovr/db/repository/snapshots";

type SnapshotTimings = { queuedMs: number | null; processingMs: number | null };

const elapsedMs = (from: string | null, to: string | null): number | null => {
  if (!from || !to) {
    return null;
  }

  const ms = Math.round(Date.parse(to) - Date.parse(from));
  return ms > 0 ? ms : null;
};

export const getSnapshotTimings = (
  snapshot: Pick<SnapshotDbSchema, "queuedAt" | "startedAt" | "completedAt">,
): SnapshotTimings => ({
  queuedMs: elapsedMs(snapshot.queuedAt, snapshot.startedAt ?? snapshot.completedAt),
  processingMs: elapsedMs(snapshot.startedAt, snapshot.completedAt),
});
