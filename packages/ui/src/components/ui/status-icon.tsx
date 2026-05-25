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

type StatusKind = "changed" | "passed" | "pending" | "stale" | "approved" | "rejected";

const ICON_MAP: Record<StatusKind, LucideIcon> = {
  changed: AlertCircleIcon,
  passed: CircleCheckIcon,
  pending: LoaderCircleIcon,
  stale: TriangleAlertIcon,
  approved: CircleCheckIcon,
  rejected: CircleXIcon,
};

const statusIconVariants = cva("", {
  variants: {
    kind: {
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
  kind: StatusKind;
  size?: number;
  className?: string;
};

function StatusIcon({ kind, size = 16, className }: StatusIconProps) {
  return (
    <Icon
      icon={ICON_MAP[kind]}
      size={size}
      className={cn(statusIconVariants({ kind }), className)}
    />
  );
}

export { StatusIcon, statusIconVariants };
export type { StatusKind, StatusIconProps };
