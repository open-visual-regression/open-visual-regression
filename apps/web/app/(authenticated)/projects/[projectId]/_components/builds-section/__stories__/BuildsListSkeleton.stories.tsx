import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BuildsListSkeleton } from "../BuildsList";

const meta: Meta<typeof BuildsListSkeleton> = {
  title: "Web/Skeletons/BuildsListSkeleton",
  component: BuildsListSkeleton,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
  decorators: [
    (Story) => (
      <div className="flex h-[600px] max-w-2xl flex-col py-3 px-5 md:py-4 md:px-6 lg:py-6 lg:px-10">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BuildsListSkeleton>;

export const Default: Story = {};
