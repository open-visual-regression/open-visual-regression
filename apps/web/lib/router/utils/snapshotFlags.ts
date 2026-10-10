import type { SnapshotFlag, SnapshotFlagDetail } from "@ovr/api/contracts/snapshots";
import type { FlakySnapshotDbSchema } from "@ovr/db/repository/flakySnapshots";

export type SnapshotFlagFields = {
  isFlaky: boolean;
  hasUncaughtPageError: boolean;
};

export type SnapshotFlagDetailFields = {
  flakySnapshot: FlakySnapshotDbSchema | undefined;
  matchesEarlierVariant: boolean;
  hasUncaughtPageError: boolean;
};

export const getSnapshotFlags = ({
  isFlaky,
  hasUncaughtPageError,
}: SnapshotFlagFields): SnapshotFlag[] => {
  const flags: SnapshotFlag[] = [];

  if (isFlaky) {
    flags.push("flaky");
  }

  if (hasUncaughtPageError) {
    flags.push("warning");
  }

  return flags;
};

export const getSnapshotFlagDetails = ({
  flakySnapshot,
  matchesEarlierVariant,
  hasUncaughtPageError,
}: SnapshotFlagDetailFields): SnapshotFlagDetail[] => {
  const flags: SnapshotFlagDetail[] = [];

  if (flakySnapshot || matchesEarlierVariant) {
    flags.push({
      flag: "flaky",
      history: flakySnapshot
        ? {
            sampleCount: flakySnapshot.sampleCount,
            changeCount: flakySnapshot.changeCount,
            revertCount: flakySnapshot.revertCount,
            sameCommitMismatchCount: flakySnapshot.sameCommitMismatchCount,
          }
        : null,
      matchesEarlierVariant,
    });
  }

  if (hasUncaughtPageError) {
    flags.push({ flag: "warning" });
  }

  return flags;
};
