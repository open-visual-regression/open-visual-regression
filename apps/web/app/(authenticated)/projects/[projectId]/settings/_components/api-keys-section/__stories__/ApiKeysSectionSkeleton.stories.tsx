import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ApiKeysSectionSkeleton } from "../ApiKeysSection";

const meta: Meta<typeof ApiKeysSectionSkeleton> = {
  title: "Web/Skeletons/ApiKeysSectionSkeleton",
  component: ApiKeysSectionSkeleton,
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
type Story = StoryObj<typeof ApiKeysSectionSkeleton>;

export const Default: Story = {};
