import { describe, expect, test, vi } from "vitest";

const dbClient = {
  diffs: { findById: vi.fn() },
  snapshots: { findById: vi.fn() },
  builds: { findById: vi.fn() },
  projects: { findById: vi.fn() },
  baselines: { upsert: vi.fn() },
};

vi.mock("@ovr/db/client", () => ({ dbClient }));

const { promoteBaseline } = await import("../baselines");

const DIFF_ID = "diff-1";
const APPROVER_ID = "user-1";

const diffRow = { id: DIFF_ID, snapshotId: "snapshot-1" };
const snapshotRow = {
  id: "snapshot-1",
  buildId: "build-1",
  captureConfigurationId: "config-1",
  targetId: "story-a",
};
const buildRow = { id: "build-1", projectId: "project-1" };

describe("promoteBaseline", () => {
  test("upserts a baseline when the build is on the project's default branch", async () => {
    dbClient.diffs.findById.mockResolvedValue(diffRow);
    dbClient.snapshots.findById.mockResolvedValue(snapshotRow);
    dbClient.builds.findById.mockResolvedValue({ ...buildRow, branch: "main" });
    dbClient.projects.findById.mockResolvedValue({ id: "project-1", gitMainBranch: "main" });

    await promoteBaseline(DIFF_ID, APPROVER_ID);

    expect(dbClient.baselines.upsert).toHaveBeenCalledWith({
      projectId: "project-1",
      captureConfigurationId: "config-1",
      targetId: "story-a",
      snapshotId: "snapshot-1",
      approvedBy: APPROVER_ID,
    });
  });

  test("does not upsert a baseline for a feature branch build", async () => {
    dbClient.diffs.findById.mockResolvedValue(diffRow);
    dbClient.snapshots.findById.mockResolvedValue(snapshotRow);
    dbClient.builds.findById.mockResolvedValue({ ...buildRow, branch: "feature/x" });
    dbClient.projects.findById.mockResolvedValue({ id: "project-1", gitMainBranch: "main" });

    await promoteBaseline(DIFF_ID, APPROVER_ID);

    expect(dbClient.baselines.upsert).not.toHaveBeenCalled();
  });
});
