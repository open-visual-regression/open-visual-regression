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
    <div
      style={{
        background: "var(--ovr-bg-base, #0d0d0d)",
        padding: "32px",
        display: "flex",
        gap: "32px",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {STATUS_KINDS.map(({ kind, color }) => (
        <div
          key={kind}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <StatusIcon kind={kind} size={20} />
          <span
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              color: "var(--ovr-fg-secondary, #aaa)",
              textAlign: "center",
            }}
          >
            {kind}
          </span>
          <span
            style={{
              fontSize: 9,
              fontFamily: "monospace",
              color,
              textAlign: "center",
              maxWidth: 100,
              wordBreak: "break-all",
            }}
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
    <div
      style={{
        background: "var(--ovr-bg-base, #0d0d0d)",
        padding: "32px",
        display: "flex",
        gap: "24px",
        alignItems: "center",
      }}
    >
      {([14, 16, 20] as const).map((size) => (
        <div key={size} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              color: "var(--ovr-fg-muted, #666)",
              minWidth: 30,
            }}
          >
            {size}px
          </span>
          {STATUS_KINDS.map(({ kind }) => (
            <StatusIcon key={kind} kind={kind} size={size} />
          ))}
        </div>
      ))}
    </div>
  ),
};
