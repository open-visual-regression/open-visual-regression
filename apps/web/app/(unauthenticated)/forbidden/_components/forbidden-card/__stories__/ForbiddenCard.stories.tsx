import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ForbiddenCard } from "../ForbiddenCard";

const meta: Meta<typeof ForbiddenCard> = {
  title: "Web/ForbiddenCard",
  component: ForbiddenCard,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ForbiddenCard>;

export const NoRole: Story = {
  args: {
    reason: "no-role",
    email: "jane@example.com",
    accessRequestUrl: "https://opal.example.com/apps/ovr",
  },
};

export const Unverified: Story = {
  args: { reason: "unverified" },
};
