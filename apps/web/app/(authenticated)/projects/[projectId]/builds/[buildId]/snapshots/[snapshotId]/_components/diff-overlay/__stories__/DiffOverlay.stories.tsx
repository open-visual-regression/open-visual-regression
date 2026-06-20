import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DiffOverlay } from "../DiffOverlay";

const meta: Meta<typeof DiffOverlay> = {
  title: "Web/DiffOverlay",
  component: DiffOverlay,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DiffOverlay>;

export const SameSize: Story = {
  args: {
    label: "new",
    imagePath: "new-same.png",
    diffImagePath: "diff-same.png",
    alt: "snapshot of Button",
  },
};

export const SizeMismatch: Story = {
  args: {
    label: "new",
    imagePath: "new-mismatch.png",
    diffImagePath: "diff-mismatch.png",
    alt: "snapshot of Button",
  },
};

export const NoPreview: Story = {
  args: {
    label: "new",
    imagePath: null,
    diffImagePath: "diff-same.png",
    alt: "snapshot of Button",
  },
};
