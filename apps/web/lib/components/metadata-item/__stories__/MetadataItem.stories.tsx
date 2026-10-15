import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GlobeIcon, Icon } from "@ovr/ui/components/icon";

import { MetadataItem } from "../MetadataItem";

const meta: Meta<typeof MetadataItem> = {
  title: "Web/MetadataItem",
  component: MetadataItem,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MetadataItem>;

export const Default: Story = {
  args: {
    icon: <Icon icon={GlobeIcon} size={12} />,
    children: "chromium",
  },
};
