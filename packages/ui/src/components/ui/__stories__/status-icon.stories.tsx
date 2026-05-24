import type { Meta, StoryObj } from "@storybook/react-vite";

import { StatusIcon } from "../status-icon";
import type { StatusKind } from "../status-icon";

const meta: Meta<typeof StatusIcon> = {
  title: "UI/StatusIcon",
  component: StatusIcon,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof StatusIcon>;

const STATUS_KINDS: { kind: StatusKind; color: string }[] = [
  { kind: "changed", color: "var(--ovr-accent-primary)" },
  { kind: "passed", color: "var(--ovr-diff-add)" },
  { kind: "pending", color: "var(--ovr-status-pending)" },
  { kind: "stale", color: "var(--ovr-fg-muted)" },
  { kind: "approved", color: "var(--ovr-diff-add)" },
  { kind: "rejected", color: "var(--ovr-diff-remove)" },
];

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-8 p-8 bg-[var(--ovr-bg-base,#0d0d0d)]">
      {STATUS_KINDS.map(({ kind, color }) => (
        <div key={kind} className="flex flex-col items-center gap-2">
          <StatusIcon kind={kind} size={20} />
          <span className="text-[10px] font-mono text-ovr-fg-secondary text-center">{kind}</span>
          <span
            className="text-[9px] font-mono text-center max-w-[100px] break-all"
            style={{ color }}
          >
            {color}
          </span>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-8 bg-[var(--ovr-bg-base,#0d0d0d)]">
      {([14, 16, 20] as const).map((size) => (
        <div key={size} className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-ovr-fg-muted min-w-[30px]">{size}px</span>
          {STATUS_KINDS.map(({ kind }) => (
            <StatusIcon key={kind} kind={kind} size={size} />
          ))}
        </div>
      ))}
    </div>
  ),
};
