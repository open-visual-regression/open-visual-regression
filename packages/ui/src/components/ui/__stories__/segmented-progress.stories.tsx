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
  { label: "passed", count: 14, color: "blue" },
  { label: "Approved", count: 2, color: "green" },
  { label: "Needs review", count: 3, color: "amber" },
  { label: "Error", count: 1, color: "red" },
  { label: "Processing", count: 2, color: "purple" },
  { label: "Queued", count: 4, color: "gray" },
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
