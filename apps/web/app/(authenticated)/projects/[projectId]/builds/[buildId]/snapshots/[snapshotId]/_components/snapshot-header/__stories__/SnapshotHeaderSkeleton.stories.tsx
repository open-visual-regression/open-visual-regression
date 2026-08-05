import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SnapshotHeaderSkeleton } from "../SnapshotHeader";

const meta: Meta<typeof SnapshotHeaderSkeleton> = {
  title: "Web/Skeletons/SnapshotHeaderSkeleton",
  component: SnapshotHeaderSkeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
  decorators: [
    (Story) => (
      <main className="px-5 py-3 md:px-6 md:py-4 lg:px-10 lg:py-6">
        <Story />
      </main>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SnapshotHeaderSkeleton>;

export const Default: Story = {};
