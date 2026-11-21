import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DiffSettingsSection } from "../DiffSettingsSection";

const meta: Meta<typeof DiffSettingsSection> = {
  title: "Web/DiffSettingsSection",
  component: DiffSettingsSection,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof DiffSettingsSection>;

export const Default: Story = {
  args: { settings: { highlight: "smart" } },
};
