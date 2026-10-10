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

export const formatFlagDetail = (detail: SnapshotFlagDetail): string => {
  if (detail.flag === "warning") {
    return "warning: the page threw an uncaught error";
  }

  const reasons: string[] = [];

  if (detail.history) {
    const { sampleCount, changeCount, revertCount, sameCommitMismatchCount } = detail.history;
    reasons.push(
      `changed ${changeCount} times across ${sampleCount} main builds, reverted ${revertCount} times, ${sameCommitMismatchCount} same-commit mismatches`,
    );
  }

  if (detail.matchesEarlierVariant) {
    reasons.push("matches an earlier main-branch variant");
  }

  return `flaky: ${reasons.join("; ")}`;
};
