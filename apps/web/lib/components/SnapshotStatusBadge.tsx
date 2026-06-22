import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { StatusBadge, type StatusBadgeProps } from "@ovr/ui/components/status-badge";

type SnapshotStatusBadgeProps = {
  status: SnapshotDisplayStatus;
  filled?: boolean;
};

const SNAPSHOT_STATUS_BADGE: Record<
  SnapshotDisplayStatus,
  Pick<StatusBadgeProps, "variant" | "icon"> & { label: string }
> = {
  pending: { variant: "pending", icon: "pending", label: "pending" },
  needs_review: { variant: "needs_review", icon: "needs_review", label: "needs review" },
  passed: { variant: "passed", icon: "passed", label: "passed" },
  approved: { variant: "approved", icon: "approved", label: "approved" },
  rejected: { variant: "rejected", icon: "rejected", label: "rejected" },
  error: { variant: "error", icon: "error", label: "error" },
};

export const SnapshotStatusBadge = ({ status, filled }: SnapshotStatusBadgeProps) => {
  const { variant, icon, label } = SNAPSHOT_STATUS_BADGE[status];
  return (
    <StatusBadge variant={variant} icon={icon} filled={filled}>
      {label}
    </StatusBadge>
  );
};
