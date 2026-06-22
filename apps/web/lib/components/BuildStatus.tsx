import { StatusBadge, type StatusBadgeProps } from "@ovr/ui/components/status-badge";
import { type BuildStatus } from "@ovr/api/contracts/builds";

const BUILD_STATUS_BADGE: Record<
  BuildStatus,
  Pick<StatusBadgeProps, "variant" | "icon"> & {
    label: string;
  }
> = {
  pending: { variant: "pending", icon: "pending", label: "pending" },
  needs_review: { variant: "changed", icon: "changed", label: "needs review" },
  passed: { variant: "pass", icon: "passed", label: "passed" },
  rejected: { variant: "rejected", icon: "rejected", label: "rejected" },
  error: { variant: "fail", icon: "error", label: "error" },
};

export const BuildStatusBadge = ({ status }: { status: BuildStatus }) => {
  const { variant, icon, label } = BUILD_STATUS_BADGE[status];
  return (
    <StatusBadge variant={variant} icon={icon}>
      {label}
    </StatusBadge>
  );
};

export const BuildStatusStripe = ({ status }: { status: BuildStatus }) => {
  switch (status) {
    case "pending":
      return <div className="absolute inset-0 bg-ovr-status-pending" />;
    case "needs_review":
      return <div className="absolute inset-0 bg-ovr-accent" />;
    case "passed":
      return <div className="absolute inset-0 bg-ovr-diff-add" />;
    case "rejected":
    case "error":
      return <div className="absolute inset-0 bg-ovr-remove" />;
  }
};
