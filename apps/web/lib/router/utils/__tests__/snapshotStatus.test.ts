import type { SnapshotDbSchema } from "@ovr/db/repository/snapshots";

import { describe, expect, it } from "@/test-utils";

import { getSnapshotDisplayStatus } from "../snapshotStatus";

const snapshot = (overrides: Partial<SnapshotDbSchema>) =>
  ({
    id: "018f0000-0000-7000-8000-000000000000",
    status: "success",
    hasRenderError: false,
    ...overrides,
  }) as SnapshotDbSchema;

describe("getSnapshotDisplayStatus", () => {
  it("should report a skipped snapshot as skipped, with no diff to wait on", () => {
    expect(getSnapshotDisplayStatus(snapshot({ status: "skipped" }), undefined)).toBe("skipped");
  });

  it("should report a snapshot with no diff yet as queued", () => {
    expect(getSnapshotDisplayStatus(snapshot({ status: "success" }), undefined)).toBe("queued");
  });
});
