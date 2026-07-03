import { type BuildStatus } from "@ovr/api/contracts/builds";
import { StatusBadge, type StatusBadgeProps } from "@ovr/ui/components/status-badge";

const BUILD_STATUS_BADGE: Record<
  BuildStatus,
  Pick<StatusBadgeProps, "color" | "icon"> & { label: string }
> = {
  queued: { color: "gray", icon: "queued", label: "queued" },
  processing: { color: "purple", icon: "processing", label: "processing" },
  needs_review: { color: "amber", icon: "needs_review", label: "needs review" },
  passed: { color: "blue", icon: "passed", label: "auto approved" },
  approved: { color: "green", icon: "approved", label: "approved" },
  rejected: { color: "red", icon: "rejected", label: "rejected" },
  error: { color: "red", icon: "error", label: "error" },
};

export const BuildStatusBadge = ({ status }: { status: BuildStatus }) => {
  const { color, icon, label } = BUILD_STATUS_BADGE[status];
  return (
    <StatusBadge variant="outline" color={color} icon={icon}>
      {label}
    </StatusBadge>
  );
};

export const BuildStatusStripe = ({ status }: { status: BuildStatus }) => {
  switch (status) {
    case "queued":
      return <div className="absolute inset-0 bg-ovr-gray" />;
    case "processing":
      return <div className="absolute inset-0 bg-ovr-purple" />;
    case "needs_review":
      return <div className="absolute inset-0 bg-ovr-accent" />;
    case "passed":
      return <div className="absolute inset-0 bg-ovr-blue" />;
    case "approved":
      return <div className="absolute inset-0 bg-ovr-green" />;
    case "rejected":
    case "error":
      return <div className="absolute inset-0 bg-ovr-remove" />;
  }
};
