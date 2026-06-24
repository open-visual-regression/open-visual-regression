import { StatusBadge, type StatusBadgeProps } from "@ovr/ui/components/status-badge";
import { type BuildStatus } from "@ovr/api/contracts/builds";
import { cn } from "@ovr/ui/lib/utils";

const BUILD_STATUS_BADGE: Record<
  BuildStatus,
  Pick<StatusBadgeProps, "variant" | "icon"> & { label: string }
> = {
  pending: { variant: "pending", icon: "pending", label: "pending" },
  needs_review: { variant: "needs_review", icon: "needs_review", label: "needs review" },
  passed: { variant: "passed", icon: "passed", label: "passed" },
  rejected: { variant: "rejected", icon: "rejected", label: "rejected" },
  error: { variant: "error", icon: "error", label: "error" },
};

const BUILD_STATUS_COLOR_CLASS: Record<BuildStatus, string> = {
  pending: "bg-ovr-status-pending",
  needs_review: "bg-ovr-accent",
  passed: "bg-ovr-diff-add",
  rejected: "bg-ovr-remove",
  error: "bg-ovr-remove",
};

export const BuildStatusBadge = ({ status }: { status: BuildStatus }) => {
  const { variant, icon, label } = BUILD_STATUS_BADGE[status];
  return (
    <StatusBadge variant={variant} icon={icon}>
      {label}
    </StatusBadge>
  );
};

export const BuildStatusStripe = ({ status }: { status: BuildStatus }) => (
  <div className={cn("absolute inset-0", BUILD_STATUS_COLOR_CLASS[status])} />
);

export { BUILD_STATUS_COLOR_CLASS };
