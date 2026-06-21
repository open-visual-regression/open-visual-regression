import type { Meta, StoryObj } from "@storybook/react-vite";

import { cn } from "../../../lib/utils";
import { StatusIcon } from "../status-icon";
import type { StatusVariant } from "../status-icon";

const meta: Meta<typeof StatusIcon> = {
  title: "UI/StatusIcon",
  component: StatusIcon,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof StatusIcon>;

const STATUS_KINDS: { kind: StatusVariant; colorClass: string; colorToken: string }[] = [
  { kind: "changed", colorClass: "text-ovr-accent", colorToken: "--ovr-accent-primary" },
  { kind: "passed", colorClass: "text-ovr-diff-add", colorToken: "--ovr-diff-add" },
  { kind: "pending", colorClass: "text-ovr-status-pending", colorToken: "--ovr-status-pending" },
  { kind: "stale", colorClass: "text-ovr-fg-muted", colorToken: "--ovr-fg-muted" },
  { kind: "approved", colorClass: "text-ovr-diff-add", colorToken: "--ovr-diff-add" },
  { kind: "rejected", colorClass: "text-ovr-remove", colorToken: "--ovr-diff-remove" },
  { kind: "error", colorClass: "text-ovr-remove", colorToken: "--ovr-diff-remove" },
];

const SIZES = [14, 16, 20] as const;

export const AllStates: Story = {
  render: () => (
    <div className="p-8 bg-[var(--ovr-bg-base,#0d0d0d)]">
      <div className="grid grid-cols-[80px_repeat(7,1fr)] items-center gap-x-6 gap-y-3">
        <div />
        {STATUS_KINDS.map(({ kind, colorClass, colorToken }) => (
          <div key={kind} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-mono text-ovr-fg-secondary text-center">{kind}</span>
            <span className={cn("text-[9px] font-mono text-center break-all", colorClass)}>
              {colorToken}
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
                <StatusIcon variant={kind} size={size} />
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  ),
};
