import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GitIntegrationSectionSkeleton } from "../GitIntegrationSection";

const meta: Meta<typeof GitIntegrationSectionSkeleton> = {
  title: "Web/Skeletons/GitIntegrationSectionSkeleton",
  component: GitIntegrationSectionSkeleton,
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
type Story = StoryObj<typeof GitIntegrationSectionSkeleton>;

export const Default: Story = {};
