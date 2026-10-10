import type { SnapshotFlag, SnapshotFlagDetail } from "@ovr/api/contracts/snapshots";

type SnapshotFlagFields = {
  flags?: (SnapshotFlag | SnapshotFlagDetail)[];
  isFlaky: boolean;
  hasUncaughtPageError: boolean;
};

export const getSnapshotFlags = (snapshot: SnapshotFlagFields): SnapshotFlag[] => {
  // Servers that predate `flags` only send the deprecated booleans.
  if (!snapshot.flags) {
    const flags: SnapshotFlag[] = [];

    if (snapshot.isFlaky) {
      flags.push("flaky");
    }

    if (snapshot.hasUncaughtPageError) {
      flags.push("warning");
    }

    return flags;
  }

  return snapshot.flags.map((flag) => (typeof flag === "string" ? flag : flag.flag));
};

export const formatFlags = (flags: SnapshotFlag[]): string =>
  flags.length === 0 ? "-" : flags.join(", ");

const formatTimes = (count: number): string => (count === 1 ? "1 time" : `${count} times`);

export const formatFlagDetail = (detail: SnapshotFlagDetail): string => {
  if (detail.flag === "warning") {
    return "warning: the page threw an uncaught error";
  }

  const reasons: string[] = [];

  if (detail.detection) {
    const { sampleCount, changeCount, revertCount, sameCommitMismatchCount } = detail.detection;
    reasons.push(
      `screenshot changed ${formatTimes(changeCount)} across the last ${sampleCount} builds`,
      `changed back to an earlier look ${formatTimes(revertCount)}`,
      `the same code produced different screenshots ${formatTimes(sameCommitMismatchCount)}`,
    );
  }

  if (detail.matchesEarlierVariant) {
    reasons.push("matches how the story looked in an earlier build");
  }

  return `flaky: ${reasons.join("; ")}`;
};
