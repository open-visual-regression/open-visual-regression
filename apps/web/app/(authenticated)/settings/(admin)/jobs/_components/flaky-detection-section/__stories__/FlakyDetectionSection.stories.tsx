import type { Meta, StoryObj } from "@storybook/nextjs-vite";

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

const args = {
  settings: { enabled: true, cron: "0 */6 * * *", windowBuilds: 50 },
  lastRunAt: "2026-06-20T12:00:00.000Z",
  nextRunAt: "2026-06-20T18:00:00.000Z",
  running: false,
};

export const Enabled: Story = {
  args,
};

export const Disabled: Story = {
  args: { ...args, settings: { ...args.settings, enabled: false }, nextRunAt: null },
};

export const Running: Story = {
  args: { ...args, running: true },
};
