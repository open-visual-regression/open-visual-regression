import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NavigationBarSkeleton } from "../NavigationBarSkeleton";

const meta: Meta<typeof NavigationBarSkeleton> = {
  title: "Web/Skeletons/NavigationBarSkeleton",
  component: NavigationBarSkeleton,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof NavigationBarSkeleton>;

/** Shown while the navigation slot resolves the session and breadcrumb. */
export const Default: Story = {};
