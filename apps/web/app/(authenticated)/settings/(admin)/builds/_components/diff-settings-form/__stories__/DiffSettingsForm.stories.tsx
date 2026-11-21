import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DiffSettingsForm } from "../DiffSettingsForm";

const meta: Meta<typeof DiffSettingsForm> = {
  title: "Web/DiffSettingsForm",
  component: DiffSettingsForm,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof DiffSettingsForm>;

export const Default: Story = {
  args: { settings: { algorithm: "smart" } },
};
