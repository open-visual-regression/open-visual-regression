import type { SnapshotFlag, SnapshotFlagDetail } from "@ovr/api/contracts/snapshots";
import type { FlakySnapshotDbSchema } from "@ovr/db/repository/flakySnapshots";

export const getSnapshotFlags = ({
  isFlaky,
  hasUncaughtPageError,
}: {
  isFlaky: boolean;
  hasUncaughtPageError: boolean;
}): SnapshotFlag[] => {
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
}: {
  flakySnapshot: FlakySnapshotDbSchema | undefined;
  matchesEarlierVariant: boolean;
  hasUncaughtPageError: boolean;
}): SnapshotFlagDetail[] => {
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
