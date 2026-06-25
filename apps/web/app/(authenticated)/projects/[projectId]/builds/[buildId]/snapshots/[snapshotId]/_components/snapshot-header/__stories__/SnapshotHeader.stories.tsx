import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { BuildSchema } from "@ovr/api/contracts/builds";
import type { DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { mocks } from "@ovr/mocks";
import { SnapshotHeader } from "../SnapshotHeader";

const meta: Meta<typeof SnapshotHeader> = {
  title: "Web/SnapshotHeader",
  component: SnapshotHeader,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SnapshotHeader>;

const snapshot: SnapshotSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  targetName: "Kitchen Sink",
  targetTitle: "UI/Button",
  imagePath: "new.png",
  status: "passed",
  errorLogs: [],
};

const diff: DiffSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e3",
  processingStatus: "diffed",
  reviewStatus: "needs_review",
  diffImagePath: "diff.png",
  pixelDiffCount: 10,
  diffPercent: 1,
  baselineSnapshot: { imagePath: "baseline.png" },
};

const buildOverrides: Partial<BuildSchema> = {
  name: "Add empty state to projects table",
  commitSha: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
  author: "Jordan Lee",
  createdAt: "2026-06-20T12:00:00.000Z",
};

export const Passed: Story = {
  args: {
    snapshot: { ...snapshot, status: "passed" },
    build: mocks.build.generateBuild(buildOverrides),
    diff: { ...diff, reviewStatus: "not_required" },
  },
};

export const NeedsReview: Story = {
  args: {
    snapshot: { ...snapshot, status: "needs_review" },
    build: mocks.build.generateBuild(buildOverrides),
    diff,
  },
};

export const Rejected: Story = {
  args: {
    snapshot: { ...snapshot, status: "rejected" },
    build: mocks.build.generateBuild(buildOverrides),
    diff: { ...diff, reviewStatus: "rejected" },
  },
};

export const Errored: Story = {
  args: {
    snapshot: { ...snapshot, status: "error" },
    build: mocks.build.generateBuild(buildOverrides),
    diff: null,
  },
};
