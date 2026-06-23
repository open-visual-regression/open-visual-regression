import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-badge font-semibold tracking-label uppercase whitespace-nowrap",
  {
    variants: {
      variant: {
        passed: "text-ovr-diff-add",
        approved: "text-ovr-status-approved",
        error: "text-ovr-remove",
        rejected: "text-ovr-status-rejected",
        pending: "text-ovr-status-pending",
        stale: "text-ovr-fg-muted",
        needs_review: "text-ovr-accent",
        neutral: "text-ovr-fg-secondary",
      },
      filled: {
        true: "border-transparent",
        false: "bg-transparent",
      },
    },
    compoundVariants: [
      { variant: "passed", filled: false, className: "border-ovr-diff-add" },
      { variant: "approved", filled: false, className: "border-ovr-status-approved" },
      { variant: "error", filled: false, className: "border-ovr-remove" },
      { variant: "rejected", filled: false, className: "border-ovr-status-rejected" },
      { variant: "pending", filled: false, className: "border-ovr-status-pending" },
      { variant: "stale", filled: false, className: "border-ovr-fg-muted" },
      { variant: "needs_review", filled: false, className: "border-ovr-accent" },
      { variant: "neutral", filled: false, className: "border-ovr-fg-secondary" },
      { variant: "passed", filled: true, className: "bg-ovr-diff-add text-ovr-on-accent" },
      {
        variant: "approved",
        filled: true,
        className: "bg-ovr-status-approved text-ovr-on-accent",
      },
      { variant: "error", filled: true, className: "bg-ovr-remove text-ovr-on-accent" },
      {
        variant: "rejected",
        filled: true,
        className: "bg-ovr-status-rejected text-ovr-on-accent",
      },
      { variant: "pending", filled: true, className: "bg-ovr-status-pending text-ovr-on-accent" },
      { variant: "stale", filled: true, className: "bg-ovr-fg-muted text-ovr-on-accent" },
      { variant: "needs_review", filled: true, className: "bg-ovr-accent text-ovr-on-accent" },
      { variant: "neutral", filled: true, className: "bg-ovr-fg-secondary text-ovr-on-accent" },
    ],
    defaultVariants: {
      variant: "neutral",
      filled: false,
    },
  },
);

type BadgeVariant =
  | "passed"
  | "approved"
  | "error"
  | "rejected"
  | "pending"
  | "stale"
  | "needs_review"
  | "neutral";

type BadgeProps = VariantProps<typeof badgeVariants> & {
  children: React.ReactNode;
  className?: string;
};

const Badge = ({ variant, filled, children, className }: BadgeProps) => {
  return <span className={cn(badgeVariants({ variant, filled }), className)}>{children}</span>;
};

export { Badge, badgeVariants };
export type { BadgeVariant, BadgeProps };
