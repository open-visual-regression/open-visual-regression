import { Badge } from "@ovr/ui/components/badge";
import { StatusIcon } from "@ovr/ui/components/status-icon";
import type { StatusVariant } from "@ovr/ui/components/status-icon";
import { cn } from "@ovr/ui/lib/utils";

type RunStatus = "changed" | "passed" | "failed" | "pending" | "stale";

interface RunRowProps {
  id: string | number;
  commit: string;
  message: string;
  branch: string;
  author: string;
  age: string;
  status: RunStatus;
  changedCount?: number;
  approved?: boolean;
  errorNote?: string;
  onClick?: () => void;
  className?: string;
}

const STRIP_COLOR: Record<RunStatus, string> = {
  changed: "bg-ovr-accent",
  passed: "bg-ovr-diff-add",
  failed: "bg-ovr-remove",
  pending: "bg-ovr-status-pending",
  stale: "bg-ovr-fg-muted",
};

const STATUS_ICON: Record<RunStatus, StatusVariant> = {
  changed: "changed",
  passed: "passed",
  failed: "changed",
  pending: "pending",
  stale: "stale",
};

const RunRow = ({
  id,
  commit,
  message,
  branch,
  author,
  age,
  status,
  changedCount,
  approved,
  errorNote,
  onClick,
  className,
}: RunRowProps) => (
  <div
    onClick={onClick}
    className={cn(
      "flex items-stretch h-9 border-b border-ovr-border-subtle",
      "cursor-pointer overflow-hidden hover:bg-ovr-hover",
      className,
    )}
  >
    <div className={cn("w-[3px] shrink-0 self-stretch", STRIP_COLOR[status])} />

    <div className="flex items-center flex-1 px-2 gap-3 text-xs min-w-0 whitespace-nowrap">
      <StatusIcon
        variant={STATUS_ICON[status]}
        size={12}
        className={cn(status === "failed" && "text-ovr-remove")}
      />

      <span className="w-12 shrink-0 text-ovr-fg-tertiary">#{id}</span>

      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
        <span className="text-[11px] text-ovr-fg-tertiary shrink-0">{commit.slice(0, 7)}</span>
        <span className="truncate">{message}</span>
        {approved && (
          <span className="shrink-0">
            <Badge variant="pass">✓ approved</Badge>
          </span>
        )}
        {errorNote && <span className="text-[11px] text-ovr-remove shrink-0">· {errorNote}</span>}
      </div>

      <span className="w-20 text-[11px] text-ovr-fg-secondary truncate shrink-0">{branch}</span>
      <span className="w-16 text-[11px] text-ovr-fg-tertiary shrink-0">{author}</span>

      <span className="w-24 text-right shrink-0">
        {status === "changed" && (
          <span className="text-ovr-accent font-semibold">{changedCount} changed</span>
        )}
        {status === "passed" && <span className="text-ovr-diff-add">pass</span>}
        {status === "failed" && <span className="text-ovr-remove">fail</span>}
        {status === "pending" && <span className="text-ovr-status-pending">running…</span>}
        {status === "stale" && <span className="text-ovr-fg-muted">stale</span>}
      </span>

      <span className="w-16 text-right text-[11px] text-ovr-fg-tertiary shrink-0">{age}</span>
    </div>
  </div>
);

export { RunRow };
export type { RunRowProps, RunStatus };
