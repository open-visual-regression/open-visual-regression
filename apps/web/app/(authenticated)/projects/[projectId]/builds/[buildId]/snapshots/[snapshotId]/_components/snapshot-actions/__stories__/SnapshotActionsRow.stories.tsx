import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";

import { SnapshotActionsRow } from "../SnapshotActionsRow";

const meta: Meta<typeof SnapshotActionsRow> = {
  title: "Web/SnapshotActionsRow",
  component: SnapshotActionsRow,
  tags: ["autodocs"],
  args: {
    projectId: "019edfc7-e040-7492-86b2-ccfdc00cf6e1",
    buildId: "019edfc7-e040-7492-86b2-ccfdc00cf6e0",
    onToggleSidebar: fn(),
  },
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SnapshotActionsRow>;

const snapshot: SnapshotSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  viewportName: "desktop",
  targetId: "ui-button--primary",
  targetName: "Kitchen Sink",
  targetTitle: "UI/Button",
  imagePath: "new.png",
  status: "needs_review",
  errorLogs: [],
};

const diff: DiffSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e3",
  processingStatus: "success",
  reviewStatus: "needs_review",
  diffImagePath: "diff.png",
  pixelDiffCount: 10,
  diffPercent: 1,
  baselineSnapshot: { imagePath: "baseline.png" },
};

const prevSnapshotId = "019edfc7-e040-7492-86b2-ccfdc00cf6e4";
const nextSnapshotId = "019edfc7-e040-7492-86b2-ccfdc00cf6e5";

export const NeedsReview: Story = {
  args: {
    snapshot,
    diff,
    prevSnapshotId,
    nextSnapshotId,
    position: 3,
    total: 5,
    canReview: true,
    sidebarCollapsed: true,
  },
};

export const SidebarExpanded: Story = {
  args: {
    ...NeedsReview.args,
    sidebarCollapsed: false,
  },
};

export const ViewerOnly: Story = {
  args: {
    ...NeedsReview.args,
    canReview: false,
  },
};

export const NoReviewQueue: Story = {
  args: {
    ...NeedsReview.args,
    prevSnapshotId: null,
    nextSnapshotId: null,
    position: null,
    total: null,
  },
};

export const Approved: Story = {
  args: {
    ...NeedsReview.args,
    snapshot: { ...snapshot, status: "approved" },
  },
};

export const Rejected: Story = {
  args: {
    ...NeedsReview.args,
    snapshot: { ...snapshot, status: "rejected" },
  },
};
