import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GlobeIcon, Icon, TimerIcon } from "@ovr/ui/components/icon";
import { ResolutionIcon } from "@ovr/ui/components/resolution-icon";

import { MetadataItem } from "../../metadata-item/MetadataItem";
import { MetadataList } from "../MetadataList";

const meta: Meta<typeof MetadataList> = {
  title: "Web/MetadataList",
  component: MetadataList,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof MetadataList>;

export const Default: Story = {
  args: {
    children: (
      <>
        <MetadataItem icon={<Icon icon={GlobeIcon} size={12} />}>chromium</MetadataItem>
        <MetadataItem icon={<ResolutionIcon width={1280} size={12} />}>desktop</MetadataItem>
        <MetadataItem icon={<Icon icon={TimerIcon} size={12} />}>933ms</MetadataItem>
      </>
    ),
  },
};
