import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[2px] border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase whitespace-nowrap",
  {
    variants: {
      variant: {
        pass: "text-ovr-diff-add",
        fail: "text-ovr-remove",
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
      { variant: "fail", filled: false, className: "border-ovr-remove" },
      { variant: "pending", filled: false, className: "border-ovr-status-pending" },
      { variant: "stale", filled: false, className: "border-ovr-fg-muted" },
      { variant: "changed", filled: false, className: "border-ovr-accent" },
      { variant: "neutral", filled: false, className: "border-ovr-fg-secondary" },
      { variant: "pass", filled: true, className: "bg-ovr-diff-add/15" },
      { variant: "fail", filled: true, className: "bg-ovr-remove/15" },
      { variant: "pending", filled: true, className: "bg-ovr-status-pending/15" },
      { variant: "stale", filled: true, className: "bg-ovr-fg-muted/15" },
      { variant: "changed", filled: true, className: "bg-ovr-accent/15" },
      { variant: "neutral", filled: true, className: "bg-ovr-fg-secondary/15" },
    ],
    defaultVariants: {
      variant: "neutral",
      filled: false,
    },
  },
);

type BadgeVariant = "pass" | "fail" | "pending" | "stale" | "changed" | "neutral";

type BadgeProps = VariantProps<typeof badgeVariants> & {
  children: React.ReactNode;
  className?: string;
};

function Badge({ variant, filled, children, className }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, filled }), className)}>{children}</span>;
}

export { Badge, badgeVariants };
export type { BadgeVariant, BadgeProps };
