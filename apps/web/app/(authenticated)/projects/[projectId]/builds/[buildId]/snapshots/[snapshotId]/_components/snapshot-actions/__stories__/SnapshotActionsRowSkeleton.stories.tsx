import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SnapshotActionsRowSkeleton } from "../SnapshotActionsRow";

const meta: Meta<typeof SnapshotActionsRowSkeleton> = {
  title: "Web/Skeletons/SnapshotActionsRowSkeleton",
  component: SnapshotActionsRowSkeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SnapshotActionsRowSkeleton>;

export const Default: Story = {};
