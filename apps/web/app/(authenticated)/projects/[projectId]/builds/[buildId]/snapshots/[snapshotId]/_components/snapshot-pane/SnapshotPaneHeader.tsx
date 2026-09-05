import { JSX } from "react";

import { cn } from "@ovr/ui/lib/utils";

type SnapshotPaneHeaderProps = JSX.IntrinsicElements["div"];

export const SnapshotPaneHeader = ({ className, children, ...props }: SnapshotPaneHeaderProps) => (
  // Panes get narrow when a tall snapshot is scaled down to fit, so the labels
  // clip rather than spilling over the pane beside them.
  <div {...props} className={cn("flex h-7 items-center overflow-hidden", className)}>
    {children}
  </div>
);
