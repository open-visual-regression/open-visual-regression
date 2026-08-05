import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NavigationBarSkeleton } from "../NavigationBarSkeleton";

const meta: Meta<typeof NavigationBarSkeleton> = {
  title: "Web/Skeletons/NavigationBarSkeleton",
  component: NavigationBarSkeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof NavigationBarSkeleton>;

export const Default: Story = {};
