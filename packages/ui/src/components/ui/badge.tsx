import { cn } from "../../lib/utils";

type BadgeTone = "pass" | "fail" | "pending" | "stale" | "changed" | "neutral";

interface BadgeProps {
  tone?: BadgeTone;
  filled?: boolean;
  children: React.ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<BadgeTone, { text: string; border: string; filledBg: string }> = {
  pass: {
    text: "text-ovr-diff-add",
    border: "border-ovr-diff-add",
    filledBg: "bg-ovr-diff-add/15",
  },
  fail: {
    text: "text-ovr-remove",
    border: "border-ovr-remove",
    filledBg: "bg-ovr-remove/15",
  },
  pending: {
    text: "text-ovr-status-pending",
    border: "border-ovr-status-pending",
    filledBg: "bg-ovr-status-pending/15",
  },
  stale: {
    text: "text-ovr-fg-muted",
    border: "border-ovr-fg-muted",
    filledBg: "bg-ovr-fg-muted/15",
  },
  changed: {
    text: "text-ovr-accent",
    border: "border-ovr-accent",
    filledBg: "bg-ovr-accent/15",
  },
  neutral: {
    text: "text-ovr-fg-secondary",
    border: "border-ovr-fg-secondary",
    filledBg: "bg-ovr-fg-secondary/15",
  },
};

function Badge({ tone = "neutral", filled = false, children, className }: BadgeProps) {
  const { text, border, filledBg } = TONE_CLASSES[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[2px] px-1.5 py-0.5",
        "text-[10px] font-semibold tracking-[0.08em] uppercase whitespace-nowrap",
        text,
        filled ? [filledBg, "border border-transparent"] : ["bg-transparent border", border],
        className,
      )}
    >
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeTone, BadgeProps };
