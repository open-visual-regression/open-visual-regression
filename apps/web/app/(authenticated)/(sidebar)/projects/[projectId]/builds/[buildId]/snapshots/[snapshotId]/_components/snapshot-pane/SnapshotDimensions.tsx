"use client";

import { Typography } from "@ovr/ui/components/typography";

import { useImageSizes } from "./useCanvasSize";

export type SnapshotDimensionsProps = {
  imagePath: string | null;
  comparedImagePaths: (string | null)[];
};

export const SnapshotDimensions = ({ imagePath, comparedImagePaths }: SnapshotDimensionsProps) => {
  const [imageSize] = useImageSizes([imagePath]) ?? [];
  const comparedSizes = useImageSizes(comparedImagePaths) ?? [];

  const sizesDiffer = comparedSizes.some(
    ({ width, height }) => width !== imageSize?.width || height !== imageSize?.height,
  );

  if (!imageSize || !sizesDiffer) {
    return null;
  }

  return (
    <Typography variant="caption" className="tabular-nums">
      {imageSize.width}×{imageSize.height}
    </Typography>
  );
};
