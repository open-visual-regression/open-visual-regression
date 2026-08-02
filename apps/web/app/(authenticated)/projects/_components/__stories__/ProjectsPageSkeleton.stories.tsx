import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProjectsPageSkeleton } from "../ProjectsPageSkeleton";

const meta: Meta<typeof ProjectsPageSkeleton> = {
  title: "Web/Skeletons/ProjectsPageSkeleton",
  component: ProjectsPageSkeleton,
  tags: ["autodocs"],
  parameters: {
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
type Story = StoryObj<typeof ProjectsPageSkeleton>;

export const Default: Story = {};
