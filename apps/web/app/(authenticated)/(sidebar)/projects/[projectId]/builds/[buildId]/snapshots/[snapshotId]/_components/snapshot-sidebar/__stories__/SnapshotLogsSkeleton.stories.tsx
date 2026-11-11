import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SnapshotLogsSkeleton } from "../SnapshotLogs";

const meta: Meta<typeof SnapshotLogsSkeleton> = {
  title: "Web/Skeletons/SnapshotLogsSkeleton",
  component: SnapshotLogsSkeleton,
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
type Story = StoryObj<typeof SnapshotLogsSkeleton>;

export const Default: Story = {};
