import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ExternalLink } from "../ExternalLink";

const meta: Meta<typeof ExternalLink> = {
  title: "Web/ExternalLink",
  component: ExternalLink,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ExternalLink>;

export const Default: Story = {
  args: {
    href: "https://github.com/acme/web/commit/abc1234",
    children: "abc1234",
  },
};
