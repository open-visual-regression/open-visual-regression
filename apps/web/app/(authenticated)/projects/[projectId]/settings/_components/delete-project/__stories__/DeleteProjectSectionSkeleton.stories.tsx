import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DeleteProjectSectionSkeleton } from "../DeleteProjectSection";

const meta: Meta<typeof DeleteProjectSectionSkeleton> = {
  title: "Web/Skeletons/DeleteProjectSectionSkeleton",
  component: DeleteProjectSectionSkeleton,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "mobile"],
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DeleteProjectSectionSkeleton>;

export const Default: Story = {};
