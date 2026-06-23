import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SnapshotCardSkeleton } from "../SnapshotCardSkeleton";

const meta: Meta<typeof SnapshotCardSkeleton> = {
  title: "Web/SnapshotCardSkeleton",
  component: SnapshotCardSkeleton,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SnapshotCardSkeleton>;

export const Default: Story = {
  render: () => (
    <div className="w-60">
      <SnapshotCardSkeleton />
    </div>
  ),
};
