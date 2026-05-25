import type { Meta, StoryObj } from "@storybook/react-vite";

import { KeyHint } from "../key-hint";

const meta: Meta<typeof KeyHint> = {
  title: "UI/KeyHint",
  component: KeyHint,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof KeyHint>;

export const AllKeys: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2 p-4">
      {["J", "K", "A", "R", "⌘K", "⇧Tab"].map((key) => (
        <KeyHint key={key}>{key}</KeyHint>
      ))}
    </div>
  ),
};

export const Single: Story = {
  args: {
    children: "J",
  },
};
