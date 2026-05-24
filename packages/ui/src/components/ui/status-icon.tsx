import type { LucideIcon } from "lucide-react";
import {
  AlertCircleIcon,
  CircleCheckIcon,
  CircleXIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { Icon } from "./icon";

type StatusKind = "changed" | "passed" | "pending" | "stale" | "approved" | "rejected";

const STATUS_MAP: Record<
  StatusKind,
  {
    icon: LucideIcon;
    color: string;
    spin?: boolean;
  }
> = {
  changed: { icon: AlertCircleIcon, color: "var(--ovr-accent-primary)" },
  passed: { icon: CircleCheckIcon, color: "var(--ovr-diff-add)" },
  pending: { icon: LoaderCircleIcon, color: "var(--ovr-status-pending)", spin: true },
  stale: { icon: TriangleAlertIcon, color: "var(--ovr-fg-muted)" },
  approved: { icon: CircleCheckIcon, color: "var(--ovr-diff-add)" },
  rejected: { icon: CircleXIcon, color: "var(--ovr-diff-remove)" },
};

type StatusIconProps = {
  kind: StatusKind;
  size?: number;
  className?: string;
};

function StatusIcon({ kind, size = 16, className }: StatusIconProps) {
  const { icon, color, spin } = STATUS_MAP[kind];

  return (
    <Icon
      icon={icon}
      size={size}
      style={{ color }}
      className={spin ? `animate-spin${className ? ` ${className}` : ""}` : className}
    />
  );
}

export { StatusIcon };
export type { StatusKind, StatusIconProps };
