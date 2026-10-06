import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DEFAULT_FLAKY_DETECTION_SETTINGS } from "@ovr/api/contracts/jobs";

import { FlakyDetectionSection } from "../FlakyDetectionSection";

const meta: Meta<typeof FlakyDetectionSection> = {
  title: "Web/FlakyDetectionSection",
  component: FlakyDetectionSection,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof FlakyDetectionSection>;

export const Disabled: Story = {
  args: {
    settings: DEFAULT_FLAKY_DETECTION_SETTINGS,
  },
};

export const Enabled: Story = {
  args: {
    settings: { enabled: true, cron: "0 */6 * * *", windowBuilds: 50 },
  },
};
