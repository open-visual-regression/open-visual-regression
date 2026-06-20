import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

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

export const ToggleDiff: Story = {
  args: SameSize.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const diffImage = canvas.getByRole("img", { name: "diff overlay of snapshot of Button" });

    await expect(diffImage).toHaveStyle({ opacity: "1" });

    await userEvent.click(canvas.getByRole("switch"));
    await expect(diffImage).toHaveStyle({ opacity: "0" });

    await userEvent.click(canvas.getByRole("switch"));
    await expect(diffImage).toHaveStyle({ opacity: "1" });
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
