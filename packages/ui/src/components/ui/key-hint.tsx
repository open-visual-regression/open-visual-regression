import { cn } from "../../lib/utils";

interface KeyHintProps {
  children: React.ReactNode;
  className?: string;
}

function KeyHint({ children, className }: KeyHintProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "h-4.5 min-w-4.5 px-1",
        "rounded-[2px] border border-ovr-border-subtle bg-ovr-inset",
        "font-mono text-[10px] font-semibold text-ovr-fg-tertiary",
        className,
      )}
    >
      {children}
    </span>
  );
}

export { KeyHint };
export type { KeyHintProps };
