import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { BuildSchema } from "@ovr/api/contracts/builds";
import { mocks } from "@ovr/mocks";

import { BuildActionsRow } from "../BuildActionsRow";

const meta: Meta<typeof BuildActionsRow> = {
  title: "Web/BuildActionsRow",
  component: BuildActionsRow,
  tags: ["autodocs"],
  args: {
    projectId: "019edfc7-e040-7492-86b2-ccfdc00cf6e1",
    canReview: true,
  },
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof BuildActionsRow>;

const snapshotCounts = {
  unchanged: 3,
  auto_approved: 2,
  approved: 1,
  needs_review: 2,
  rejected: 0,
  error: 1,
  canceled: 0,
  queued: 3,
  processing: 1,
};

const buildOverrides: Partial<BuildSchema> = {
  name: "Add empty state to projects table",
};

export const NeedsReview: Story = {
  args: {
    build: mocks.build.generateBuild({
      ...buildOverrides,
      status: "needs_review",
    }),
    snapshotCounts,
  },
};

export const Cancelable: Story = {
  args: {
    build: mocks.build.generateBuild({
      ...buildOverrides,
      status: "processing",
    }),
    snapshotCounts,
  },
};

export const Approved: Story = {
  args: {
    build: mocks.build.generateBuild({
      ...buildOverrides,
      status: "approved",
    }),
    snapshotCounts,
  },
};

export const Rejected: Story = {
  args: {
    build: mocks.build.generateBuild({
      ...buildOverrides,
      status: "rejected",
    }),
    snapshotCounts,
  },
};

export const NoActions: Story = {
  args: {
    build: mocks.build.generateBuild({
      ...buildOverrides,
      status: "canceled",
    }),
    snapshotCounts,
  },
};
