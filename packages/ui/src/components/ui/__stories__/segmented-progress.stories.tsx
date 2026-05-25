import type { Meta, StoryObj } from "@storybook/react-vite";

import { SegmentedProgress } from "../segmented-progress";

const meta: Meta<typeof SegmentedProgress> = {
  title: "UI/SegmentedProgress",
  component: SegmentedProgress,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SegmentedProgress>;

const SEGMENTS = [
  { label: "pass", count: 14, color: "var(--ovr-diff-add)" },
  { label: "changed", count: 3, color: "var(--ovr-accent-primary)" },
  { label: "failed", count: 1, color: "var(--ovr-diff-remove)" },
  { label: "pending", count: 4, color: "var(--ovr-status-pending)" },
];

export const Default: Story = {
  render: () => (
    <div className="space-y-8 p-4 w-80">
      <SegmentedProgress
        segments={SEGMENTS}
        title="run #1284"
        subtitle="22 stories"
        summary="3 changed · 1 failed · 4 pending"
      />
      <SegmentedProgress
        segments={SEGMENTS}
        title="run #1284"
        subtitle="22 stories"
        summary="3 changed · 1 failed · 4 pending"
        height={4}
      />
    </div>
  ),
};
