import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { InvitationCardSkeleton } from "../InvitationCard";

const meta: Meta<typeof InvitationCardSkeleton> = {
  title: "Web/Skeletons/InvitationCardSkeleton",
  component: InvitationCardSkeleton,
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
type Story = StoryObj<typeof InvitationCardSkeleton>;

export const Default: Story = {};
