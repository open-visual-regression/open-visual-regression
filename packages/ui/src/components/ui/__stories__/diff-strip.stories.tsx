import type { Meta, StoryObj } from "@storybook/react-vite";

import { DiffStrip } from "../diff-strip";
import type { DiffStripStatus } from "../diff-strip";

const meta: Meta<typeof DiffStrip> = {
  title: "UI/DiffStrip",
  component: DiffStrip,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DiffStrip>;

const STATUSES: DiffStripStatus[] = ["changed", "passed", "failed", "pending", "stale"];

export const AllStatuses: Story = {
  render: () => (
    <div className="flex gap-4 p-4">
      {STATUSES.map((status) => (
        <div
          key={status}
          style={{
            display: "flex",
            alignItems: "stretch",
            height: 80,
            background: "var(--ovr-bg-elevated)",
            border: "1px solid var(--ovr-border-subtle)",
          }}
        >
          <DiffStrip status={status} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              fontSize: 12,
              color: "var(--ovr-fg-secondary)",
            }}
          >
            {status}
          </div>
        </div>
      ))}
    </div>
  ),
};
