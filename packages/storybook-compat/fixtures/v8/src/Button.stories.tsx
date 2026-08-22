import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: "Default" },
};

// Exercises the `ovr` story parameters that the extract step reads out of the
// preview via `__STORYBOOK_PREVIEW__.loadStory`.
export const WithOvrParameters: Story = {
  args: { label: "Overridden" },
  parameters: {
    ovr: {
      viewports: [{ width: 320, height: 240 }],
      diffThreshold: 0.5,
    },
  },
};

export const Skipped: Story = {
  args: { label: "Skipped" },
  parameters: { ovr: { skip: true } },
};

// A play function is what makes the preview emit `storyFinished`, so the
// capture strategy's "played" wait is only meaningful with one of these.
export const WithPlay: Story = {
  args: { label: "Played" },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector("[data-testid='fixture-button']");
    if (!button) {
      throw new Error("button did not render");
    }
  },
};

export const PlayThrows: Story = {
  args: { label: "Throws" },
  play: async () => {
    throw new Error("intentional play failure");
  },
};
