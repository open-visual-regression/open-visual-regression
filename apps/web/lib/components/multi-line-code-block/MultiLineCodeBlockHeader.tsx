import { cn } from "@ovr/ui/lib/utils";
import { JSX } from "react";

type MultiLineCodeBlockHeaderProps = JSX.IntrinsicElements["div"];

export const MultiLineCodeBlockHeader = ({
  className,
  children,
  ...props
}: MultiLineCodeBlockHeaderProps) => (
  <div
    {...props}
    className={cn(
      "flex h-8 items-center gap-2.5 border-b border-ovr-border-subtle bg-ovr-elevated px-3",
      className,
    )}
  >
    {children}
  </div>
);
