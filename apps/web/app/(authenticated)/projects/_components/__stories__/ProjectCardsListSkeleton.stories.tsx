import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProjectCardsListSkeleton } from "../ProjectCardsList";

const meta: Meta<typeof ProjectCardsListSkeleton> = {
  title: "Web/Skeletons/ProjectCardsListSkeleton",
  component: ProjectCardsListSkeleton,
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
type Story = StoryObj<typeof ProjectCardsListSkeleton>;

export const Default: Story = {};
