"use client";

import { SnapshotFrameImage } from "./SnapshotFrameImage";
import { SnapshotPaneCanvas } from "./SnapshotPaneCanvas";
import { SnapshotPaneFrame } from "./SnapshotPaneFrame";
import { useCanvasSize } from "./useCanvasSize";

export type SnapshotPaneImageProps = {
  imagePath: string | null;
  alt: string;
  canvasImagePaths?: (string | null)[];
  children?: React.ReactNode;
};

export const SnapshotPaneImage = ({
  imagePath,
  alt,
  canvasImagePaths = [imagePath],
  children,
}: SnapshotPaneImageProps) => {
  const canvasSize = useCanvasSize(canvasImagePaths);

  return (
    <SnapshotPaneCanvas className="lg:@container-size">
      <SnapshotPaneFrame canvasSize={canvasSize}>
        <SnapshotFrameImage imagePath={imagePath} alt={alt} canvasSize={canvasSize} />
        {children}
      </SnapshotPaneFrame>
    </SnapshotPaneCanvas>
  );
};
