import { JSX } from "react";

import { cn } from "@ovr/ui/lib/utils";

type SnapshotPaneCanvasProps = JSX.IntrinsicElements["div"];

export const SnapshotPaneCanvas = ({ className, children, ...props }: SnapshotPaneCanvasProps) => (
  <div
    {...props}
    className={cn(
      "relative flex min-h-64 items-start justify-start overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid lg:flex-1",
      className,
    )}
  >
    {children}
  </div>
);
