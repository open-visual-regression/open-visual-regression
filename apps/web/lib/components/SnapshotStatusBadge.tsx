import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { StatusBadge, type StatusBadgeProps } from "@ovr/ui/components/status-badge";

type SnapshotStatusBadgeProps = {
  status: SnapshotDisplayStatus;
  filled?: boolean;
};

const SNAPSHOT_STATUS_BADGE: Record<
  SnapshotDisplayStatus,
  Pick<StatusBadgeProps, "color" | "icon"> & { label: string }
> = {
  queued: { color: "gray", icon: "queued", label: "Queued" },
  processing: { color: "purple", icon: "processing", label: "Processing" },
  needs_review: { color: "amber", icon: "needs_review", label: "Needs review" },
  unchanged: { color: "blue", icon: "unchanged", label: "Unchanged" },
  auto_approved: { color: "green", icon: "auto_approved", label: "Auto approved" },
  approved: { color: "green", icon: "approved", label: "Approved" },
  rejected: { color: "red", icon: "rejected", label: "Rejected" },
  error: { color: "red", icon: "error", label: "Error" },
  canceled: { color: "gray", icon: "canceled", label: "Canceled" },
  skipped: { color: "gray", icon: "skipped", label: "Skipped" },
};

export const getSnapshotStatusLabel = (status: SnapshotDisplayStatus): string =>
  SNAPSHOT_STATUS_BADGE[status].label;

export const SnapshotStatusBadge = ({ status, filled }: SnapshotStatusBadgeProps) => {
  const { color, icon, label } = SNAPSHOT_STATUS_BADGE[status];
  return (
    <StatusBadge variant={filled ? "solid" : "outline"} color={color} icon={icon}>
      {label}
    </StatusBadge>
  );
};
