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

const SIZES = [14, 16, 20] as const;

export const AllStates: Story = {
  render: () => (
    <div className="p-8 bg-[var(--ovr-bg-base,#0d0d0d)]">
      <div
        className={`grid items-center gap-x-6 gap-y-3`}
        style={{ gridTemplateColumns: `80px repeat(${STATUS_KINDS.length}, 1fr)` }}
      >
        <div />
        {STATUS_KINDS.map(({ kind, color }) => (
          <div key={kind} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-mono text-ovr-fg-secondary text-center">{kind}</span>
            <span className="text-[9px] font-mono text-center break-all" style={{ color }}>
              {color}
            </span>
          </div>
        ))}
        {SIZES.map((size) => (
          <>
            <span key={`${size}-label`} className="text-[10px] font-mono text-ovr-fg-muted">
              {size}px
            </span>
            {STATUS_KINDS.map(({ kind }) => (
              <div key={`${size}-${kind}`} className="flex justify-center">
                <StatusIcon kind={kind} size={size} />
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  ),
};
