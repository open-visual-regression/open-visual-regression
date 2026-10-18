import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SnapshotHistoryListSkeleton } from "../SnapshotHistoryList";

const meta: Meta<typeof SnapshotHistoryListSkeleton> = {
  title: "Web/Skeletons/SnapshotHistoryListSkeleton",
  component: SnapshotHistoryListSkeleton,
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
type Story = StoryObj<typeof SnapshotHistoryListSkeleton>;

export const Default: Story = {};
