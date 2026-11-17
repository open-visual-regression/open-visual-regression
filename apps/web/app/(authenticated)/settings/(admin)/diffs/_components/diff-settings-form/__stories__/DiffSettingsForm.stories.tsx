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

export const Aligned: Story = {
  args: { settings: { algorithm: "aligned" } },
};

export const PixelByPixel: Story = {
  args: { settings: { algorithm: "pixel" } },
};
