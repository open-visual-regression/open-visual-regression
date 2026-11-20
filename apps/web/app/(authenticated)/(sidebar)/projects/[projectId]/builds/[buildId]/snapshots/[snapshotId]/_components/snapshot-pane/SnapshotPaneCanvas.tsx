import { JSX } from "react";

import { cn } from "@ovr/ui/lib/utils";

type SnapshotPaneCanvasProps = JSX.IntrinsicElements["div"] & {
  pending?: boolean;
};

export const SnapshotPaneCanvas = ({
  pending = false,
  className,
  children,
  ...props
}: SnapshotPaneCanvasProps) => (
  <div
    {...props}
    className={cn(
      "relative flex min-h-64 items-start justify-start overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid",
      pending && "flex-1",
      className,
    )}
  >
    {children}
  </div>
);
