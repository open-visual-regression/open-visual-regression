import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SnapshotReviews } from "../SnapshotReviews";

const meta: Meta<typeof SnapshotReviews> = {
  title: "Web/SnapshotReviews",
  component: SnapshotReviews,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SnapshotReviews>;

const diffId = "019edfc7-e040-7492-86b2-ccfdc00cf6e1";

export const Default: Story = {
  args: {
    diffId,
    requiredReviewerCount: 2,
    reviews: [
      {
        reviewerId: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
        name: "Ada Lovelace",
        image: null,
        vote: "approve",
        reviewedAt: "2026-06-22T00:00:00.000Z",
      },
      {
        reviewerId: "019edfc7-e040-7492-86b2-ccfdc00cf6e3",
        name: "Alan Turing",
        image: null,
        vote: "approve",
        reviewedAt: "2026-06-22T00:05:00.000Z",
      },
      {
        reviewerId: "019edfc7-e040-7492-86b2-ccfdc00cf6e4",
        name: "Grace Hopper",
        image: null,
        vote: "reject",
        reviewedAt: "2026-06-22T00:10:00.000Z",
      },
    ],
  },
};

export const SingleApproval: Story = {
  args: {
    diffId,
    requiredReviewerCount: 1,
    reviews: [
      {
        reviewerId: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
        name: "Ada Lovelace",
        image: null,
        vote: "approve",
        reviewedAt: "2026-06-22T00:00:00.000Z",
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    diffId,
    requiredReviewerCount: 1,
    reviews: [],
  },
};

export const AsOwnReviewer: Story = {
  args: {
    ...Default.args,
    currentUserId: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
  },
};

export const AsAdmin: Story = {
  args: {
    ...Default.args,
    isAdmin: true,
  },
};
