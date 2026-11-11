import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SnapshotReviewsSkeleton } from "../SnapshotReviews";

const meta: Meta<typeof SnapshotReviewsSkeleton> = {
  title: "Web/Skeletons/SnapshotReviewsSkeleton",
  component: SnapshotReviewsSkeleton,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-120 p-3">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SnapshotReviewsSkeleton>;

export const Default: Story = {};
