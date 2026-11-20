"use client";

import { SnapshotFrameImage } from "./SnapshotFrameImage";
import { SnapshotPaneCanvas } from "./SnapshotPaneCanvas";
import { SnapshotPaneFrame } from "./SnapshotPaneFrame";
import { useCanvasSize, useIsCanvasSizePending } from "./useCanvasSize";

export type SnapshotPaneImageProps = {
  imagePath: string | null;
  alt: string;
  canvasImagePaths?: (string | null)[];
  trigger?: React.ReactNode;
  children?: React.ReactNode;
};

export const SnapshotPaneImage = ({
  imagePath,
  alt,
  canvasImagePaths = [imagePath],
  trigger,
  children,
}: SnapshotPaneImageProps) => {
  const canvasSize = useCanvasSize(canvasImagePaths);
  const pending = useIsCanvasSizePending(canvasImagePaths);

  return (
    <SnapshotPaneCanvas pending={pending}>
      <SnapshotPaneFrame canvasSize={canvasSize}>
        <SnapshotFrameImage imagePath={imagePath} alt={alt} canvasSize={canvasSize} />
        {children}
      </SnapshotPaneFrame>
      {trigger}
    </SnapshotPaneCanvas>
  );
};
