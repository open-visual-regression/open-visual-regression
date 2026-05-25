type DiffStripStatus = "changed" | "passed" | "failed" | "pending" | "stale";

const STATUS_COLORS: Record<DiffStripStatus, string> = {
  changed: "var(--ovr-accent-primary)",
  passed: "var(--ovr-diff-add)",
  failed: "var(--ovr-diff-remove)",
  pending: "var(--ovr-status-pending)",
  stale: "var(--ovr-fg-muted)",
};

interface DiffStripProps {
  status: DiffStripStatus;
}

function DiffStrip({ status }: DiffStripProps) {
  return (
    <div
      style={{
        width: 3,
        alignSelf: "stretch",
        flexShrink: 0,
        borderRadius: 0,
        background: STATUS_COLORS[status],
      }}
    />
  );
}

export { DiffStrip };
export type { DiffStripProps, DiffStripStatus };
