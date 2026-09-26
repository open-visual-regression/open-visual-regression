import { JSX } from "react";

import { cn } from "@ovr/ui/lib/utils";

type SnapshotPaneHeaderProps = JSX.IntrinsicElements["div"];

export const SnapshotPaneHeader = ({ className, children, ...props }: SnapshotPaneHeaderProps) => (
  <div {...props} className={cn("flex h-7 items-center", className)}>
    {children}
  </div>
);
