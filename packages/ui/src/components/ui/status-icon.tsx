import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircleIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleXIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { cn } from "../../lib/utils";
import { Icon } from "./icon";

type StatusVariant =
  | "needs_review"
  | "passed"
  | "queued"
  | "processing"
  | "stale"
  | "approved"
  | "rejected"
  | "error";

const ICON_MAP: Record<StatusVariant, LucideIcon> = {
  needs_review: AlertCircleIcon,
  passed: CircleCheckIcon,
  queued: CircleDashedIcon,
  processing: LoaderCircleIcon,
  stale: TriangleAlertIcon,
  approved: CircleCheckIcon,
  rejected: CircleXIcon,
  error: TriangleAlertIcon,
};

const statusIconVariants = cva("", {
  variants: {
    variant: {
      needs_review: "text-ovr-amber",
      passed: "text-ovr-blue",
      queued: "text-ovr-gray",
      processing: "text-ovr-purple animate-spin",
      stale: "text-ovr-fg-muted",
      approved: "text-ovr-green",
      rejected: "text-ovr-red",
      error: "text-ovr-red",
    },
  },
});

type StatusIconProps = VariantProps<typeof statusIconVariants> & {
  variant: StatusVariant;
  size?: number;
  className?: string;
};

const StatusIcon = ({ variant, size = 16, className }: StatusIconProps) => {
  return (
    <Icon
      icon={ICON_MAP[variant]}
      size={size}
      className={cn(statusIconVariants({ variant }), className)}
    />
  );
};

export { StatusIcon, statusIconVariants };
export type { StatusVariant, StatusIconProps };
