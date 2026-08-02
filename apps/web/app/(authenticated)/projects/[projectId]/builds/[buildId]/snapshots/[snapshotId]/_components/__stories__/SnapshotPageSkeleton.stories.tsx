import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SnapshotPageSkeleton } from "../SnapshotPageSkeleton";

const meta: Meta<typeof SnapshotPageSkeleton> = {
  title: "Web/Skeletons/SnapshotPageSkeleton",
  component: SnapshotPageSkeleton,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
  decorators: [
    (Story) => (
      <main className="relative h-screen">
        <Story />
      </main>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SnapshotPageSkeleton>;

export const Default: Story = {};
