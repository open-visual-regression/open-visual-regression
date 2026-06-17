import { Readable } from "node:stream";

import { PNG } from "pngjs";
import { describe, expect, test, vi } from "vitest";

const dbClient = {
  snapshots: { findById: vi.fn() },
  builds: { findById: vi.fn() },
  projects: { findById: vi.fn() },
  baselines: { find: vi.fn() },
  diffs: { updateStatus: vi.fn(), updateResult: vi.fn(), hasAllDoneForBuild: vi.fn() },
};

const storage = { getFileStream: vi.fn(), uploadFile: vi.fn() };
const enqueueFinalize = vi.fn();
const pixelmatch = vi.fn();

vi.mock("@ovr/db/client", () => ({ dbClient }));
vi.mock("@ovr/storage", () => ({ storage }));
vi.mock("../lib/queue", () => ({ enqueueDiff: vi.fn(), enqueueFinalize }));
vi.mock("pixelmatch", () => ({ default: pixelmatch }));

const { diffSnapshot } = await import("../snapshots");

const BUILD_ID = "build-1";
const PROJECT_ID = "project-1";
const DIFF_ID = "diff-1";
const SNAPSHOT_ID = "snapshot-1";
const BASELINE_SNAPSHOT_ID = "snapshot-baseline";

const pngBuffer = (): Buffer => {
  const png = new PNG({ width: 2, height: 2 });
  png.data.fill(255);
  return PNG.sync.write(png);
};

const snapshotRow = {
  id: SNAPSHOT_ID,
  buildId: BUILD_ID,
  captureConfigurationId: "config-1",
  targetId: "story-a",
  status: "captured" as const,
  imagePath: "builds/build-1/snapshots/snapshot-1.png",
  hasRenderError: false,
};

const baselineSnapshotRow = {
  ...snapshotRow,
  id: BASELINE_SNAPSHOT_ID,
  imagePath: "builds/build-0/snapshots/baseline.png",
};

const buildRow = { id: BUILD_ID, projectId: PROJECT_ID, branch: "feature" };
const projectRow = { id: PROJECT_ID, diffThreshold: 0.1, gitMainBranch: "main" };

describe("diffSnapshot", () => {
  test("marks needs_review when there is no baseline, and enqueues finalize if last diff", async () => {
    dbClient.snapshots.findById.mockResolvedValue(snapshotRow);
    dbClient.builds.findById.mockResolvedValue(buildRow);
    dbClient.projects.findById.mockResolvedValue(projectRow);
    dbClient.baselines.find.mockResolvedValue(undefined);
    dbClient.diffs.hasAllDoneForBuild.mockResolvedValue(true);

    await diffSnapshot(SNAPSHOT_ID, DIFF_ID);

    expect(dbClient.diffs.updateStatus).toHaveBeenCalledWith(DIFF_ID, "needs_review");
    expect(enqueueFinalize).toHaveBeenCalledWith({ buildId: BUILD_ID });
  });

  test("marks auto_approved when the diff is within threshold", async () => {
    dbClient.snapshots.findById.mockImplementation((id: string) =>
      Promise.resolve(id === BASELINE_SNAPSHOT_ID ? baselineSnapshotRow : snapshotRow),
    );
    dbClient.builds.findById.mockResolvedValue(buildRow);
    dbClient.projects.findById.mockResolvedValue(projectRow);
    dbClient.baselines.find.mockResolvedValue({ snapshotId: BASELINE_SNAPSHOT_ID });
    dbClient.diffs.hasAllDoneForBuild.mockResolvedValue(false);
    storage.getFileStream.mockImplementation(() => Promise.resolve(Readable.from(pngBuffer())));
    pixelmatch.mockReturnValue(0);

    await diffSnapshot(SNAPSHOT_ID, DIFF_ID);

    expect(dbClient.diffs.updateResult).toHaveBeenCalledWith(DIFF_ID, {
      status: "auto_approved",
      pixelDiffCount: 0,
      diffPercent: 0,
    });
    expect(storage.uploadFile).not.toHaveBeenCalled();
  });

  test("marks needs_review and uploads a diff image when the diff exceeds threshold", async () => {
    dbClient.snapshots.findById.mockImplementation((id: string) =>
      Promise.resolve(id === BASELINE_SNAPSHOT_ID ? baselineSnapshotRow : snapshotRow),
    );
    dbClient.builds.findById.mockResolvedValue(buildRow);
    dbClient.projects.findById.mockResolvedValue(projectRow);
    dbClient.baselines.find.mockResolvedValue({ snapshotId: BASELINE_SNAPSHOT_ID });
    dbClient.diffs.hasAllDoneForBuild.mockResolvedValue(false);
    storage.getFileStream.mockImplementation(() => Promise.resolve(Readable.from(pngBuffer())));
    pixelmatch.mockReturnValue(4);

    await diffSnapshot(SNAPSHOT_ID, DIFF_ID);

    expect(storage.uploadFile).toHaveBeenCalledWith(
      `builds/${BUILD_ID}/diffs/${DIFF_ID}.png`,
      expect.any(Buffer),
      "image/png",
    );
    expect(dbClient.diffs.updateResult).toHaveBeenCalledWith(DIFF_ID, {
      status: "needs_review",
      diffImagePath: `builds/${BUILD_ID}/diffs/${DIFF_ID}.png`,
      pixelDiffCount: 4,
      diffPercent: 100,
    });
  });
});
