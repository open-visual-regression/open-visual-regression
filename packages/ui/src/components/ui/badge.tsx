import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-badge font-semibold tracking-label uppercase whitespace-nowrap",
  {
    variants: {
      variant: {
        pass: "text-ovr-diff-add",
        approved: "text-ovr-diff-add",
        fail: "text-ovr-remove",
        rejected: "text-ovr-remove",
        pending: "text-ovr-status-pending",
        stale: "text-ovr-fg-muted",
        changed: "text-ovr-accent",
        neutral: "text-ovr-fg-secondary",
      },
      filled: {
        true: "border-transparent",
        false: "bg-transparent",
      },
    },
    compoundVariants: [
      { variant: "pass", filled: false, className: "border-ovr-diff-add" },
      { variant: "approved", filled: false, className: "border-ovr-diff-add" },
      { variant: "fail", filled: false, className: "border-ovr-remove" },
      { variant: "rejected", filled: false, className: "border-ovr-remove" },
      { variant: "pending", filled: false, className: "border-ovr-status-pending" },
      { variant: "stale", filled: false, className: "border-ovr-fg-muted" },
      { variant: "changed", filled: false, className: "border-ovr-accent" },
      { variant: "neutral", filled: false, className: "border-ovr-fg-secondary" },
      { variant: "pass", filled: true, className: "bg-ovr-diff-add text-ovr-on-accent" },
      { variant: "approved", filled: true, className: "bg-ovr-diff-add text-ovr-on-accent" },
      { variant: "fail", filled: true, className: "bg-ovr-remove text-ovr-on-accent" },
      { variant: "rejected", filled: true, className: "bg-ovr-remove text-ovr-on-accent" },
      { variant: "pending", filled: true, className: "bg-ovr-status-pending text-ovr-on-accent" },
      { variant: "stale", filled: true, className: "bg-ovr-fg-muted text-ovr-on-accent" },
      { variant: "changed", filled: true, className: "bg-ovr-accent text-ovr-on-accent" },
      { variant: "neutral", filled: true, className: "bg-ovr-fg-secondary text-ovr-on-accent" },
    ],
    defaultVariants: {
      variant: "neutral",
      filled: false,
    },
  },
);

type BadgeVariant =
  | "pass"
  | "approved"
  | "fail"
  | "rejected"
  | "pending"
  | "stale"
  | "changed"
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
