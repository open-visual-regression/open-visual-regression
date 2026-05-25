import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "../badge";
import type { BadgeTone } from "../badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Badge>;

const TONES: BadgeTone[] = ["pass", "fail", "pending", "stale", "changed", "neutral"];

export const Grid: Story = {
  render: () => (
    <div className="p-4">
      <div className="grid grid-cols-6 gap-4">
        {TONES.map((tone) => (
          <div key={tone} className="flex flex-col items-center gap-2">
            <span className="text-ovr-fg-muted text-[10px] uppercase tracking-[0.08em]">
              {tone}
            </span>
            <Badge tone={tone}>{tone}</Badge>
            <Badge tone={tone} filled>
              {tone}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const Outlined: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 p-4">
      {TONES.map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};

export const Filled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 p-4">
      {TONES.map((tone) => (
        <Badge key={tone} tone={tone} filled>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};
