import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SnapshotGridSkeleton } from "../SnapshotGrid";

const meta: Meta<typeof SnapshotGridSkeleton> = {
  title: "Web/Skeletons/SnapshotGridSkeleton",
  component: SnapshotGridSkeleton,
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
type Story = StoryObj<typeof SnapshotGridSkeleton>;

export const Default: Story = {};
