import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";
import { BuildHeader } from "../BuildHeader";

const meta: Meta<typeof BuildHeader> = {
  title: "Web/BuildHeader",
  component: BuildHeader,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof BuildHeader>;

const snapshotCounts = { pass: 3, changed: 2, rejected: 0, fail: 1, pending: 4 };

export const NeedsReview: Story = {
  args: {
    build: mocks.build.generateBuild({ status: "needs_review" }),
    snapshotCounts,
  },
};

export const Passed: Story = {
  args: {
    build: mocks.build.generateBuild({ status: "passed" }),
    snapshotCounts,
  },
};

export const Rejected: Story = {
  args: {
    build: mocks.build.generateBuild({ status: "rejected" }),
    snapshotCounts,
  },
};

export const Errored: Story = {
  args: {
    build: mocks.build.generateBuild({
      status: "error",
      errorMessage: "Build failed: unable to connect to the test runner.",
    }),
    snapshotCounts: { pass: 0, changed: 0, rejected: 0, fail: 0, pending: 0 },
  },
};
