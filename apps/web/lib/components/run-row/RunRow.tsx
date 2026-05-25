import { cva } from "class-variance-authority";

import { StatusIcon } from "@ovr/ui/components/status-icon";
import type { StatusVariant } from "@ovr/ui/components/status-icon";
import { cn } from "@ovr/ui/lib/utils";

type RunStatus = "changed" | "passed" | "failed" | "pending" | "stale";

type RunRowProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  status: RunStatus;
  runId: string | number;
  commit: string;
  message: string;
  branch: string;
  author: string;
  age: string;
  changedCount?: number;
  children?: React.ReactNode;
};

const stripVariants = cva("w-[3px] shrink-0 self-stretch", {
  variants: {
    status: {
      changed: "bg-ovr-accent",
      passed: "bg-ovr-diff-add",
      failed: "bg-ovr-remove",
      pending: "bg-ovr-status-pending",
      stale: "bg-ovr-fg-muted",
    },
  },
});

const STATUS_ICON: Record<RunStatus, StatusVariant> = {
  changed: "changed",
  passed: "passed",
  failed: "changed",
  pending: "pending",
  stale: "stale",
};

const RunRow = ({
  status,
  runId,
  commit,
  message,
  branch,
  author,
  age,
  changedCount,
  children,
  className,
  ...props
}: RunRowProps) => (
  <button
    type="button"
    className={cn(
      "flex w-full items-stretch h-9 border-b border-ovr-border-subtle",
      "bg-transparent p-0 text-left cursor-pointer overflow-hidden",
      "hover:bg-ovr-hover focus-visible:outline-none focus-visible:bg-ovr-hover",
      className,
    )}
    {...props}
  >
    <div className={cn(stripVariants({ status }))} />

    <div className="flex items-center flex-1 px-2 gap-3 text-xs min-w-0 whitespace-nowrap font-mono">
      <StatusIcon
        variant={STATUS_ICON[status]}
        size={12}
        className={status === "failed" ? "text-ovr-remove" : undefined}
      />

      <span className="w-12 shrink-0 text-ovr-fg-tertiary">#{runId}</span>

      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
        <span className="text-[11px] text-ovr-fg-tertiary shrink-0">{commit.slice(0, 7)}</span>
        <span className="truncate text-ovr-fg">{message}</span>
        {children}
      </div>

      <span className="w-20 text-[11px] text-ovr-fg-secondary truncate shrink-0">{branch}</span>
      <span className="w-16 text-[11px] text-ovr-fg-tertiary shrink-0">{author}</span>

      <span className="w-24 text-right shrink-0">
        {status === "changed" ? (
          <span className="text-ovr-accent font-semibold">{changedCount} changed</span>
        ) : status === "passed" ? (
          <span className="text-ovr-diff-add">pass</span>
        ) : status === "failed" ? (
          <span className="text-ovr-remove">fail</span>
        ) : status === "pending" ? (
          <span className="text-ovr-status-pending">running…</span>
        ) : (
          <span className="text-ovr-fg-muted">stale</span>
        )}
      </span>

      <span className="w-16 text-right text-[11px] text-ovr-fg-tertiary shrink-0">{age}</span>
    </div>
  </button>
);

export { RunRow };
export type { RunRowProps, RunStatus };
