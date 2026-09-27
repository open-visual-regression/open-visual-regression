import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PlusIcon, SettingsIcon } from "@ovr/ui/components/icon";

import { ResponsiveActionButton, ResponsiveActionButtonSkeleton } from "../ResponsiveActionButton";

const meta: Meta<typeof ResponsiveActionButton> = {
  title: "Web/ResponsiveActionButton",
  component: ResponsiveActionButton,
  tags: ["autodocs"],
  args: {
    icon: PlusIcon,
    children: "new project",
    href: "#",
  },
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResponsiveActionButton>;

export const Default: Story = {};

export const IconEnd: Story = {
  args: {
    icon: SettingsIcon,
    iconPosition: "end",
    children: "project settings",
  },
};

export const Skeleton: Story = {
  render: () => <ResponsiveActionButtonSkeleton />,
};
