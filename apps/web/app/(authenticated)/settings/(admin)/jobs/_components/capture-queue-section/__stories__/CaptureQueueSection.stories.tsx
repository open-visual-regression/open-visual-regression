import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CaptureQueueSection } from "../CaptureQueueSection";

const meta: Meta<typeof CaptureQueueSection> = {
  title: "Web/CaptureQueueSection",
  component: CaptureQueueSection,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CaptureQueueSection>;

export const Default: Story = {
  args: { settings: { policy: "deadline" }, envPolicy: null },
};

export const SetByServer: Story = {
  args: { settings: { policy: "deadline" }, envPolicy: "fifo" },
};
