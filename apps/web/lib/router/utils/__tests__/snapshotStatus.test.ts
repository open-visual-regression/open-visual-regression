import { mocks } from "@ovr/mocks";

import { describe, expect, it } from "@/test-utils";

import { getSnapshotDisplayStatus } from "../snapshotStatus";

describe("getSnapshotDisplayStatus", () => {
  it("marks a brand-new snapshot with no prior baseline as auto_approved", () => {
    const snapshot = mocks.snapshot.generateSnapshot();
    const diff = mocks.snapshot.generateDiff({ baselineSnapshotId: null, diffPercent: null });

    expect(getSnapshotDisplayStatus(snapshot, diff)).toBe("auto_approved");
  });

  it("marks an updated snapshot that exceeded the threshold as auto_approved", () => {
    const snapshot = mocks.snapshot.generateSnapshot({ diffThreshold: 0.05 });
    const diff = mocks.snapshot.generateDiff({ diffPercent: 5 });

    expect(getSnapshotDisplayStatus(snapshot, diff)).toBe("auto_approved");
  });

  it("marks a snapshot unchanged when it matched an existing baseline within threshold", () => {
    const snapshot = mocks.snapshot.generateSnapshot({ diffThreshold: 0.05 });
    const diff = mocks.snapshot.generateDiff({ diffPercent: 0 });

    expect(getSnapshotDisplayStatus(snapshot, diff)).toBe("unchanged");
  });
});
