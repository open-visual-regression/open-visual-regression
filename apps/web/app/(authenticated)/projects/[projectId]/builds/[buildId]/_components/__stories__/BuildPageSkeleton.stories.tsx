import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BuildPageSkeleton } from "../BuildPageSkeleton";

const meta: Meta<typeof BuildPageSkeleton> = {
  title: "Web/Skeletons/BuildPageSkeleton",
  component: BuildPageSkeleton,
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
type Story = StoryObj<typeof BuildPageSkeleton>;

/** Shown while a build's header, filters and snapshot grid load. */
export const Default: Story = {};
