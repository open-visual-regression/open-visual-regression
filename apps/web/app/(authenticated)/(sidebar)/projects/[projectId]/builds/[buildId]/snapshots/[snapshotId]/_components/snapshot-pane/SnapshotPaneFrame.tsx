import { JSX } from "react";

import { cn } from "@ovr/ui/lib/utils";

import type { SnapshotSize } from "./types";

type SnapshotPaneFrameProps = JSX.IntrinsicElements["div"] & {
  canvasSize: SnapshotSize | null;
};

export const SnapshotPaneFrame = ({
  canvasSize,
  className,
  children,
  ...props
}: SnapshotPaneFrameProps) => (
  <div
    {...props}
    className={cn(
      canvasSize
        ? "relative aspect-(--canvas-aspect) w-[min(100%,var(--canvas-width))] lg:w-[min(100cqw,100cqh*var(--canvas-aspect),var(--canvas-width))]"
        : "absolute inset-0",
      className,
    )}
    style={
      canvasSize
        ? ({
            "--canvas-width": `${canvasSize.width}px`,
            "--canvas-aspect": canvasSize.width / canvasSize.height,
          } as React.CSSProperties)
        : undefined
    }
  >
    {children}
  </div>
);
