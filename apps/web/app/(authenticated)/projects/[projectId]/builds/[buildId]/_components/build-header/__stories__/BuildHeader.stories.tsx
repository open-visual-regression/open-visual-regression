import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { BuildSchema } from "@ovr/api/contracts/builds";
import { mocks } from "@ovr/mocks";

import { BuildHeader } from "../BuildHeader";

const meta: Meta<typeof BuildHeader> = {
  title: "Web/BuildHeader",
  component: BuildHeader,
  tags: ["autodocs"],
  args: {
    storybookHref: "/api/storybook/mock-build/index.html",
  },
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof BuildHeader>;

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
  commitSha: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
  author: "Jordan Lee",
  createdAt: "2026-06-20T12:00:00.000Z",
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

export const AutoApproved: Story = {
  args: {
    build: mocks.build.generateBuild({
      ...buildOverrides,
      status: "auto_approved",
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

export const Errored: Story = {
  args: {
    build: mocks.build.generateBuild({
      ...buildOverrides,
      status: "error",
      errorMessage: "Build failed: unable to connect to the test runner.",
    }),
    snapshotCounts: {
      unchanged: 0,
      auto_approved: 0,
      approved: 0,
      needs_review: 0,
      rejected: 0,
      error: 0,
      canceled: 0,
      queued: 0,
      processing: 0,
    },
  },
};

export const Canceled: Story = {
  args: {
    build: mocks.build.generateBuild({
      ...buildOverrides,
      status: "canceled",
    }),
    snapshotCounts: {
      unchanged: 2,
      auto_approved: 1,
      approved: 0,
      needs_review: 0,
      rejected: 0,
      error: 0,
      canceled: 4,
      queued: 0,
      processing: 0,
    },
  },
};

export const Processing: Story = {
  args: {
    build: mocks.build.generateBuild({
      ...buildOverrides,
      status: "processing",
    }),
    snapshotCounts: {
      unchanged: 1,
      auto_approved: 0,
      approved: 0,
      needs_review: 0,
      rejected: 0,
      error: 0,
      canceled: 0,
      queued: 4,
      processing: 2,
    },
  },
};
