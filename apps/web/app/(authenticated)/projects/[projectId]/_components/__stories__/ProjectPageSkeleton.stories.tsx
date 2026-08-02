import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProjectPageSkeleton } from "../ProjectPageSkeleton";

const meta: Meta<typeof ProjectPageSkeleton> = {
  title: "Web/Skeletons/ProjectPageSkeleton",
  component: ProjectPageSkeleton,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
  decorators: [
    (Story) => (
      <main className="h-screen px-5 py-3 md:px-6 md:py-4 lg:px-10 lg:py-6">
        <Story />
      </main>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProjectPageSkeleton>;

export const Default: Story = {};
