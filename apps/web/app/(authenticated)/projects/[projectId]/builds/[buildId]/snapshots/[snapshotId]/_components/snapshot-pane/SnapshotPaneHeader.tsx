import { cn } from "@ovr/ui/lib/utils";
import { JSX } from "react";

type SnapshotPaneHeaderProps = JSX.IntrinsicElements["div"];

export const SnapshotPaneHeader = ({ className, children, ...props }: SnapshotPaneHeaderProps) => (
  <div {...props} className={cn("flex h-7 items-center", className)}>
    {children}
  </div>
);
