import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SnapshotGridSkeleton } from "../SnapshotGridSkeleton";

const meta: Meta<typeof SnapshotGridSkeleton> = {
  title: "Web/SnapshotGridSkeleton",
  component: SnapshotGridSkeleton,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SnapshotGridSkeleton>;

export const Default: Story = {};

export const FewCards: Story = {
  args: {
    count: 4,
  },
};
