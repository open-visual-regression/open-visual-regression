import { describe, expect, test, vi } from "vitest";

const dbClient = {
  diffs: { updateStatus: vi.fn(), findById: vi.fn() },
  snapshots: { findById: vi.fn() },
};
const diffSnapshot = vi.fn();
const checkAllDoneAndFinalize = vi.fn();

vi.mock("@ovr/db/client", () => ({ dbClient }));
vi.mock("@ovr/services/snapshots", () => ({ diffSnapshot, checkAllDoneAndFinalize }));

const { diffHandler, handleDiffFailed } = await import("../diff");

describe("diffHandler", () => {
  test("calls diffSnapshot with the job's snapshotId and diffId", async () => {
    await diffHandler({ data: { snapshotId: "snapshot-1", diffId: "diff-1" } } as never);

    expect(diffSnapshot).toHaveBeenCalledWith("snapshot-1", "diff-1");
  });
});

describe("handleDiffFailed", () => {
  test("marks the diff as errored and finalizes the build when it was the last diff", async () => {
    dbClient.diffs.findById.mockResolvedValue({ id: "diff-1", snapshotId: "snapshot-1" });
    dbClient.snapshots.findById.mockResolvedValue({ id: "snapshot-1", buildId: "build-1" });

    await handleDiffFailed({ data: { snapshotId: "snapshot-1", diffId: "diff-1" } } as never);

    expect(dbClient.diffs.updateStatus).toHaveBeenCalledWith("diff-1", "error");
    expect(checkAllDoneAndFinalize).toHaveBeenCalledWith("build-1");
  });
});
