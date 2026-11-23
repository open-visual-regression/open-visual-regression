"use client";

import { cn } from "@ovr/ui/lib/utils";

import { SnapshotFrameImage } from "./SnapshotFrameImage";
import { SnapshotPaneCanvas } from "./SnapshotPaneCanvas";
import { SnapshotPaneFrame } from "./SnapshotPaneFrame";
import { useCanvasSize, useIsCanvasSizePending } from "./useCanvasSize";

export type SnapshotPaneImageProps = {
  imagePath: string | null;
  alt: string;
  canvasImagePaths?: (string | null)[];
  /** A diff overlay drawn over the image, the same size as it. */
  overlay?: { imagePath: string; visible: boolean };
  trigger?: React.ReactNode;
};

export const SnapshotPaneImage = ({
  imagePath,
  alt,
  canvasImagePaths = [imagePath],
  overlay,
  trigger,
}: SnapshotPaneImageProps) => {
  const canvasSize = useCanvasSize(canvasImagePaths);
  const pending = useIsCanvasSizePending(canvasImagePaths);

  return (
    <SnapshotPaneCanvas pending={pending}>
      <SnapshotPaneFrame canvasSize={canvasSize}>
        <SnapshotFrameImage imagePath={imagePath} alt={alt} canvasSize={canvasSize} />
        {overlay ? (
          <SnapshotFrameImage
            imagePath={overlay.imagePath}
            alt={`diff overlay of ${alt}`}
            canvasSize={canvasSize}
            className={cn("pointer-events-none", overlay.visible ? "opacity-100" : "opacity-0")}
          />
        ) : null}
      </SnapshotPaneFrame>
      {trigger}
    </SnapshotPaneCanvas>
  );
};
