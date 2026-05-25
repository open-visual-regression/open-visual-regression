import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[2px] border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase whitespace-nowrap",
  {
    variants: {
      tone: {
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
      { tone: "pass", filled: false, className: "border-ovr-diff-add" },
      { tone: "fail", filled: false, className: "border-ovr-remove" },
      { tone: "pending", filled: false, className: "border-ovr-status-pending" },
      { tone: "stale", filled: false, className: "border-ovr-fg-muted" },
      { tone: "changed", filled: false, className: "border-ovr-accent" },
      { tone: "neutral", filled: false, className: "border-ovr-fg-secondary" },
      { tone: "pass", filled: true, className: "bg-ovr-diff-add/15" },
      { tone: "fail", filled: true, className: "bg-ovr-remove/15" },
      { tone: "pending", filled: true, className: "bg-ovr-status-pending/15" },
      { tone: "stale", filled: true, className: "bg-ovr-fg-muted/15" },
      { tone: "changed", filled: true, className: "bg-ovr-accent/15" },
      { tone: "neutral", filled: true, className: "bg-ovr-fg-secondary/15" },
    ],
    defaultVariants: {
      tone: "neutral",
      filled: false,
    },
  },
);

type BadgeTone = "pass" | "fail" | "pending" | "stale" | "changed" | "neutral";

type BadgeProps = VariantProps<typeof badgeVariants> & {
  children: React.ReactNode;
  className?: string;
};

function Badge({ tone, filled, children, className }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, filled }), className)}>{children}</span>;
}

export { Badge, badgeVariants };
export type { BadgeTone, BadgeProps };
