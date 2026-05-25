import { cn } from "../../lib/utils";

interface KeyHintProps {
  children: React.ReactNode;
  className?: string;
}

const KeyHint = ({ children, className }: KeyHintProps) => (
  <span
    className={cn(
      "inline-flex items-center justify-center",
      "h-4.5 min-w-4.5 px-1",
      "rounded-lg border border-ovr-border-subtle bg-ovr-inset",
      "font-mono text-badge font-semibold text-ovr-fg-tertiary",
      className,
    )}
  >
    {children}
  </span>
);

export { KeyHint };
export type { KeyHintProps };
