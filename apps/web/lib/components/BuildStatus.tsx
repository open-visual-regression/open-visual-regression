import { StatusBadge, type StatusBadgeProps } from "@ovr/ui/components/status-badge";
import { type BuildStatus } from "@ovr/api/contracts/builds";

const BUILD_STATUS_BADGE: Record<
  BuildStatus,
  Pick<StatusBadgeProps, "variant" | "icon"> & { label: string }
> = {
  queued: { variant: "queued", icon: "queued", label: "queued" },
  processing: { variant: "processing", icon: "processing", label: "processing" },
  needs_review: { variant: "needs_review", icon: "needs_review", label: "needs review" },
  passed: { variant: "passed", icon: "passed", label: "passed" },
  rejected: { variant: "rejected", icon: "rejected", label: "rejected" },
  error: { variant: "error", icon: "error", label: "error" },
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
    case "queued":
      return <div className="absolute inset-0 bg-ovr-gray" />;
    case "processing":
      return <div className="absolute inset-0 bg-ovr-purple" />;
    case "needs_review":
      return <div className="absolute inset-0 bg-ovr-accent" />;
    case "passed":
      return <div className="absolute inset-0 bg-ovr-blue" />;
    case "rejected":
    case "error":
      return <div className="absolute inset-0 bg-ovr-remove" />;
  }
};
