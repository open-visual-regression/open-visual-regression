import { JSX } from "react";

import { cn } from "@ovr/ui/lib/utils";

import type { SnapshotSize } from "./types";

type SnapshotPaneFrameProps = JSX.IntrinsicElements["div"] & {
  canvasSize: SnapshotSize | null;
  fill?: boolean;
};

export const SnapshotPaneFrame = ({
  canvasSize,
  fill = false,
  className,
  children,
  ...props
}: SnapshotPaneFrameProps) => (
  <div
    {...props}
    className={cn(
      canvasSize
        ? "relative aspect-(--canvas-aspect) lg:w-[min(100cqw,100cqh*var(--canvas-aspect),var(--canvas-width))]"
        : "absolute inset-0",
      canvasSize && (fill ? "w-full" : "w-[min(100%,var(--canvas-width))]"),
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
