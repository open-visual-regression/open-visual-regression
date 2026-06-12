import { beforeEach, describe, expect, it, vi } from "vitest";

import { dbClient } from "@ovr/db/client";

import { createBuild, finalizeBuild } from "../builds";
import { NotFoundError } from "../errors";
import { enqueueCapture } from "../lib/queue";
import { uploadDirectory } from "../lib/storage";

vi.mock("@ovr/db/client", () => ({
  dbClient: {
    projects: { findById: vi.fn<(id: string) => Promise<unknown>>() },
    builds: {
      create: vi.fn<(values: unknown) => Promise<unknown>>(),
      updateStatus: vi.fn<(id: string, status: string) => Promise<unknown>>(),
    },
    captureConfigurations: { findByProject: vi.fn<(projectId: string) => Promise<unknown[]>>() },
    snapshots: { createMany: vi.fn<(values: unknown[]) => Promise<unknown[]>>() },
    diffs: { findByBuild: vi.fn<(buildId: string) => Promise<unknown[]>>() },
  },
}));

vi.mock("../lib/queue", () => ({
  enqueueCapture: vi.fn<(payload: { buildId: string; snapshotId: string }) => Promise<unknown>>(),
}));

vi.mock("../lib/storage", () => ({
  uploadDirectory: vi.fn<(localDir: string, remotePrefix: string) => Promise<void>>(),
}));

const mockFindProjectById = vi.mocked(dbClient.projects.findById);
const mockCreateBuild = vi.mocked(dbClient.builds.create);
const mockUpdateBuildStatus = vi.mocked(dbClient.builds.updateStatus);
const mockFindCaptureConfigurationsByProject = vi.mocked(
  dbClient.captureConfigurations.findByProject,
);
const mockCreateManySnapshots = vi.mocked(dbClient.snapshots.createMany);
const mockFindDiffsByBuild = vi.mocked(dbClient.diffs.findByBuild);
const mockEnqueueCapture = vi.mocked(enqueueCapture);
const mockUploadDirectory = vi.mocked(uploadDirectory);

describe("createBuild", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const input = {
    projectId: "project-1",
    branch: "main",
    commitSha: "abc123",
    stories: ["story-a", "story-b"],
    storybookStaticDir: "/tmp/storybook-static",
  };

  it("creates the build record, one snapshot per story x capture configuration, and enqueues a capture job for each", async () => {
    mockFindProjectById.mockResolvedValue({ id: "project-1" } as never);
    mockCreateBuild.mockResolvedValue({ id: "ignored" } as never);
    mockFindCaptureConfigurationsByProject.mockResolvedValue([
      { id: "config-1" },
      { id: "config-2" },
    ] as never);
    mockCreateManySnapshots.mockResolvedValue([
      { id: "snapshot-1" },
      { id: "snapshot-2" },
      { id: "snapshot-3" },
      { id: "snapshot-4" },
    ] as never);
    mockUploadDirectory.mockResolvedValue();
    mockEnqueueCapture.mockResolvedValue(undefined as never);

    const buildId = await createBuild(input, "user-1");

    expect(mockFindProjectById).toHaveBeenCalledWith("project-1");

    expect(mockCreateBuild).toHaveBeenCalledWith({
      id: buildId,
      projectId: "project-1",
      branch: "main",
      commitSha: "abc123",
      status: "pending",
      captureMode: "worker",
      storybookPath: `builds/${buildId}/storybook`,
      createdBy: "user-1",
    });

    expect(mockCreateManySnapshots).toHaveBeenCalledWith([
      { buildId, captureConfigurationId: "config-1", storyId: "story-a", status: "pending" },
      { buildId, captureConfigurationId: "config-2", storyId: "story-a", status: "pending" },
      { buildId, captureConfigurationId: "config-1", storyId: "story-b", status: "pending" },
      { buildId, captureConfigurationId: "config-2", storyId: "story-b", status: "pending" },
    ]);

    expect(mockUploadDirectory).toHaveBeenCalledWith(
      "/tmp/storybook-static",
      `builds/${buildId}/storybook`,
    );

    expect(mockEnqueueCapture).toHaveBeenCalledTimes(4);
    expect(mockEnqueueCapture).toHaveBeenCalledWith({ buildId, snapshotId: "snapshot-1" });
    expect(mockEnqueueCapture).toHaveBeenCalledWith({ buildId, snapshotId: "snapshot-2" });
    expect(mockEnqueueCapture).toHaveBeenCalledWith({ buildId, snapshotId: "snapshot-3" });
    expect(mockEnqueueCapture).toHaveBeenCalledWith({ buildId, snapshotId: "snapshot-4" });

    expect(buildId).toBeTruthy();
  });

  it("throws NotFoundError when the project does not exist", async () => {
    mockFindProjectById.mockResolvedValue(undefined);

    await expect(createBuild(input, "user-1")).rejects.toThrow(NotFoundError);

    expect(mockCreateBuild).not.toHaveBeenCalled();
    expect(mockEnqueueCapture).not.toHaveBeenCalled();
  });
});

describe("finalizeBuild", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks the build as error when any diff errored", async () => {
    mockFindDiffsByBuild.mockResolvedValue([
      { status: "auto_approved" },
      { status: "error" },
    ] as never);

    await finalizeBuild("build-1");

    expect(mockUpdateBuildStatus).toHaveBeenCalledWith("build-1", "error");
  });

  it("marks the build as needs_review when any diff needs review", async () => {
    mockFindDiffsByBuild.mockResolvedValue([
      { status: "auto_approved" },
      { status: "needs_review" },
    ] as never);

    await finalizeBuild("build-1");

    expect(mockUpdateBuildStatus).toHaveBeenCalledWith("build-1", "needs_review");
  });

  it("marks the build as passed when all diffs are auto_approved or approved", async () => {
    mockFindDiffsByBuild.mockResolvedValue([
      { status: "auto_approved" },
      { status: "approved" },
    ] as never);

    await finalizeBuild("build-1");

    expect(mockUpdateBuildStatus).toHaveBeenCalledWith("build-1", "passed");
  });

  it("marks the build as passed when there are no diffs", async () => {
    mockFindDiffsByBuild.mockResolvedValue([]);

    await finalizeBuild("build-1");

    expect(mockUpdateBuildStatus).toHaveBeenCalledWith("build-1", "passed");
  });
});
