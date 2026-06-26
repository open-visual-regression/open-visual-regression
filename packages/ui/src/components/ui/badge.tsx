import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-badge font-semibold tracking-label uppercase whitespace-nowrap",
  {
    variants: {
      variant: {
        passed: "text-ovr-green",
        approved: "text-ovr-green",
        error: "text-ovr-red",
        rejected: "text-ovr-red",
        pending: "text-ovr-blue",
        stale: "text-ovr-fg-muted",
        needs_review: "text-ovr-amber",
        neutral: "text-ovr-fg-secondary",
      },
      filled: {
        true: "border-transparent",
        false: "bg-transparent",
      },
    },
    compoundVariants: [
      { variant: "passed", filled: false, className: "border-ovr-green" },
      { variant: "approved", filled: false, className: "border-ovr-green" },
      { variant: "error", filled: false, className: "border-ovr-red" },
      { variant: "rejected", filled: false, className: "border-ovr-red" },
      { variant: "pending", filled: false, className: "border-ovr-blue" },
      { variant: "stale", filled: false, className: "border-ovr-fg-muted" },
      { variant: "needs_review", filled: false, className: "border-ovr-amber" },
      { variant: "neutral", filled: false, className: "border-ovr-fg-secondary" },
      { variant: "passed", filled: true, className: "bg-ovr-green text-ovr-on-solid" },
      { variant: "approved", filled: true, className: "bg-ovr-green text-ovr-on-solid" },
      { variant: "error", filled: true, className: "bg-ovr-red text-ovr-on-solid" },
      { variant: "rejected", filled: true, className: "bg-ovr-red text-ovr-on-solid" },
      { variant: "pending", filled: true, className: "bg-ovr-blue text-ovr-on-solid" },
      { variant: "stale", filled: true, className: "bg-ovr-fg-muted text-ovr-on-solid" },
      { variant: "needs_review", filled: true, className: "bg-ovr-amber text-ovr-on-solid" },
      { variant: "neutral", filled: true, className: "bg-ovr-fg-secondary text-ovr-on-solid" },
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
