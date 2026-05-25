import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircleIcon,
  CircleCheckIcon,
  CircleXIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { cn } from "../../lib/utils";
import { Icon } from "./icon";

type StatusVariant = "changed" | "passed" | "pending" | "stale" | "approved" | "rejected";

const ICON_MAP: Record<StatusVariant, LucideIcon> = {
  changed: AlertCircleIcon,
  passed: CircleCheckIcon,
  pending: LoaderCircleIcon,
  stale: TriangleAlertIcon,
  approved: CircleCheckIcon,
  rejected: CircleXIcon,
};

const statusIconVariants = cva("", {
  variants: {
    variant: {
      changed: "text-ovr-accent",
      passed: "text-ovr-diff-add",
      pending: "text-ovr-status-pending animate-spin",
      stale: "text-ovr-fg-muted",
      approved: "text-ovr-diff-add",
      rejected: "text-ovr-remove",
    },
  },
});

type StatusIconProps = VariantProps<typeof statusIconVariants> & {
  variant: StatusVariant;
  size?: number;
  className?: string;
};

function StatusIcon({ variant, size = 16, className }: StatusIconProps) {
  return (
    <Icon
      icon={ICON_MAP[variant]}
      size={size}
      className={cn(statusIconVariants({ variant }), className)}
    />
  );
}

export { StatusIcon, statusIconVariants };
export type { StatusVariant, StatusIconProps };
