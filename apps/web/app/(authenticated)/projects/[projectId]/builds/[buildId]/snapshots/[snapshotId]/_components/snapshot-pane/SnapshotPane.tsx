import { cn } from "@ovr/ui/lib/utils";
import { JSX } from "react";

type SnapshotPaneProps = JSX.IntrinsicElements["div"];

export const SnapshotPane = ({ className, children, ...props }: SnapshotPaneProps) => (
  <div {...props} className={cn("flex flex-col", className)}>
    {children}
  </div>
);
