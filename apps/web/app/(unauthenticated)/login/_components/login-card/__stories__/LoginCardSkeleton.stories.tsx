import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LoginCardSkeleton } from "../LoginCard";

const meta: Meta<typeof LoginCardSkeleton> = {
  title: "Web/Skeletons/LoginCardSkeleton",
  component: LoginCardSkeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
  decorators: [
    (Story) => (
      <main className="flex justify-center px-8 py-6 md:py-12">
        <div className="w-full max-w-115">
          <Story />
        </div>
      </main>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LoginCardSkeleton>;

export const Default: Story = {};
