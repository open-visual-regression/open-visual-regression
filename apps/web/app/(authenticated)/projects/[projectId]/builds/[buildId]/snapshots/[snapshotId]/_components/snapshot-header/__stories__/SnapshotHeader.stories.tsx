import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { BuildSchema } from "@ovr/api/contracts/builds";
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
  viewportName: "desktop",
  targetName: "Kitchen Sink",
  targetTitle: "UI/Button",
  imagePath: "new.png",
  status: "unchanged",
  errorLogs: [],
};

const buildOverrides: Partial<BuildSchema> = {
  name: "Add empty state to projects table",
  commitSha: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
  author: "Jordan Lee",
  createdAt: "2026-06-20T12:00:00.000Z",
};

export const Unchanged: Story = {
  args: {
    snapshot: { ...snapshot, status: "unchanged" },
    build: mocks.build.generateBuild(buildOverrides),
  },
};

export const AutoApproved: Story = {
  args: {
    snapshot: { ...snapshot, status: "auto_approved" },
    build: mocks.build.generateBuild(buildOverrides),
  },
};

export const NeedsReview: Story = {
  args: {
    snapshot: { ...snapshot, status: "needs_review" },
    build: mocks.build.generateBuild(buildOverrides),
  },
};

export const Rejected: Story = {
  args: {
    snapshot: { ...snapshot, status: "rejected" },
    build: mocks.build.generateBuild(buildOverrides),
  },
};

export const Errored: Story = {
  args: {
    snapshot: { ...snapshot, status: "error" },
    build: mocks.build.generateBuild(buildOverrides),
  },
};
