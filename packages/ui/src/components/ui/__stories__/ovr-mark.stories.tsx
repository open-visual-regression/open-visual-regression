import type { Meta, StoryObj } from "@storybook/react-vite";

import { OvrMark } from "../ovr-mark";

const meta: Meta<typeof OvrMark> = {
  title: "UI/OvrMark",
  component: OvrMark,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof OvrMark>;

const SIZES = [16, 22, 32, 48];

export const AllSizes: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 24,
        padding: 24,
        background: "var(--ovr-bg-base)",
      }}
    >
      {SIZES.map((size) => (
        <div
          key={size}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
        >
          <OvrMark size={size} />
          <span style={{ fontSize: 11, color: "var(--ovr-fg-muted)", fontFamily: "monospace" }}>
            {size}px
          </span>
        </div>
      ))}
    </div>
  ),
};
