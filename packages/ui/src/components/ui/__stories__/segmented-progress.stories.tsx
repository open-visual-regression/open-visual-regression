import type { Meta, StoryObj } from "@storybook/react-vite";

import { Segment, SegmentedProgress, SegmentedProgressSize } from "../segmented-progress";

const meta: Meta<typeof SegmentedProgress> = {
  title: "UI/SegmentedProgress",
  component: SegmentedProgress,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SegmentedProgress>;

const SEGMENTS: Segment[] = [
  { label: "passed", count: 14, color: "green" },
  { label: "needs review", count: 3, color: "orange" },
  { label: "error", count: 1, color: "red" },
  { label: "pending", count: 4, color: "blue" },
];

export const Default: Story = {
  render: () => (
    <div className="space-y-8 p-4 w-full">
      {(["sm", "md", "lg"] satisfies SegmentedProgressSize[]).map((size) => (
        <SegmentedProgress
          key={size}
          segments={SEGMENTS}
          title="run #1284"
          subtitle="22 stories"
          size={size}
        />
      ))}
    </div>
  ),
};
