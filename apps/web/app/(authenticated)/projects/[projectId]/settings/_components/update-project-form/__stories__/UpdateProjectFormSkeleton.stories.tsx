import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UpdateProjectFormSkeleton } from "../UpdateProjectForm";

const meta: Meta<typeof UpdateProjectFormSkeleton> = {
  title: "Web/Skeletons/UpdateProjectFormSkeleton",
  component: UpdateProjectFormSkeleton,
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
type Story = StoryObj<typeof UpdateProjectFormSkeleton>;

export const Default: Story = {};
