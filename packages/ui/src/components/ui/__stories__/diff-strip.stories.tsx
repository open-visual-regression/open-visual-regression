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

const ROWS: { status: DiffStripStatus; id: string; label: string; meta: string }[] = [
  { status: "changed", id: "#1284", label: "checkout-flow", meta: "3 changed" },
  { status: "passed", id: "#1283", label: "checkout-flow", meta: "pass" },
  { status: "failed", id: "#1282", label: "marketing", meta: "1 removed" },
  { status: "pending", id: "#1281", label: "main", meta: "running…" },
  { status: "stale", id: "#1280", label: "feature/nav", meta: "stale" },
];

const META_COLOR: Record<DiffStripStatus, string> = {
  changed: "var(--ovr-accent-primary)",
  passed: "var(--ovr-diff-add)",
  failed: "var(--ovr-diff-remove)",
  pending: "var(--ovr-status-pending)",
  stale: "var(--ovr-fg-muted)",
};

export const RunRows: Story = {
  render: () => (
    <div style={{ width: 400, fontFamily: "var(--font-mono)", fontSize: 12 }}>
      {ROWS.map(({ status, id, label, meta }) => (
        <div
          key={id}
          style={{
            display: "flex",
            alignItems: "stretch",
            height: 36,
            background: "var(--ovr-bg-elevated)",
            borderBottom: "1px solid var(--ovr-border-subtle)",
            overflow: "hidden",
          }}
        >
          <DiffStrip status={status} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: 14,
              flex: 1,
            }}
          >
            <span style={{ color: "var(--ovr-fg-tertiary)" }}>{id}</span>
            <span style={{ color: "var(--ovr-fg-primary)", flex: 1 }}>{label}</span>
            <span style={{ color: META_COLOR[status], marginLeft: "auto" }}>{meta}</span>
          </div>
        </div>
      ))}
    </div>
  ),
};
