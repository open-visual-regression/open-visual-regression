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
  queued: { color: "gray", icon: "queued", label: "queued" },
  processing: { color: "purple", icon: "processing", label: "processing" },
  needs_review: { color: "amber", icon: "needs_review", label: "needs review" },
  unchanged: { color: "blue", icon: "unchanged", label: "unchanged" },
  auto_approved: { color: "green", icon: "auto_approved", label: "auto approved" },
  approved: { color: "green", icon: "approved", label: "approved" },
  rejected: { color: "red", icon: "rejected", label: "rejected" },
  error: { color: "red", icon: "error", label: "error" },
  canceled: { color: "gray", icon: "canceled", label: "canceled" },
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
