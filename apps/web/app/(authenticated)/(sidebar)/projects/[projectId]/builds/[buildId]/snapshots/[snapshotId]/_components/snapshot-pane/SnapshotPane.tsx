import { JSX } from "react";

import { cn } from "@ovr/ui/lib/utils";

type SnapshotPaneProps = JSX.IntrinsicElements["div"];

export const SnapshotPane = ({ className, children, ...props }: SnapshotPaneProps) => (
  <div {...props} className={cn("flex flex-col lg:min-h-0 lg:flex-1", className)}>
    {children}
  </div>
);
