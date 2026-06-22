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
  changed: { variant: "changed", icon: "changed", label: "needs review" },
  pass: { variant: "pass", icon: "passed", label: "passed" },
  rejected: { variant: "rejected", icon: "rejected", label: "rejected" },
  fail: { variant: "fail", icon: "error", label: "error" },
};

export const SnapshotStatusBadge = ({ status, filled }: SnapshotStatusBadgeProps) => {
  const { variant, icon, label } = SNAPSHOT_STATUS_BADGE[status];
  return (
    <StatusBadge variant={variant} icon={icon} filled={filled}>
      {label}
    </StatusBadge>
  );
};
