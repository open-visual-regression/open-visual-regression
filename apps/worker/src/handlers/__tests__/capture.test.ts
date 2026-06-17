import { describe, expect, test, vi } from "vitest";

const dbClient = { snapshots: { updateStatus: vi.fn() } };
const captureSnapshot = vi.fn();
const enqueueDiffsIfAllCaptured = vi.fn();

vi.mock("@ovr/db/client", () => ({ dbClient }));
vi.mock("@ovr/services/snapshots", () => ({ captureSnapshot, enqueueDiffsIfAllCaptured }));

const { captureHandler, handleCaptureFailed } = await import("../capture");

describe("captureHandler", () => {
  test("calls captureSnapshot with the job's snapshotId", async () => {
    await captureHandler({ data: { buildId: "build-1", snapshotId: "snapshot-1" } } as never);

    expect(captureSnapshot).toHaveBeenCalledWith("snapshot-1");
  });
});

describe("handleCaptureFailed", () => {
  test("marks the snapshot as errored and checks whether diffs can now be enqueued", async () => {
    await handleCaptureFailed({ data: { buildId: "build-1", snapshotId: "snapshot-1" } } as never);

    expect(dbClient.snapshots.updateStatus).toHaveBeenCalledWith("snapshot-1", "error");
    expect(enqueueDiffsIfAllCaptured).toHaveBeenCalledWith("build-1");
  });
});
