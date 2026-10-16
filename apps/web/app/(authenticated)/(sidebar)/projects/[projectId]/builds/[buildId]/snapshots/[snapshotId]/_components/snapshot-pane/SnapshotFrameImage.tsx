"use client";

import { Typography } from "@ovr/ui/components/typography";

import { Image } from "@/lib/components/image/Image";

import type { SnapshotSize } from "./types";
import { useCanvasSize } from "./useCanvasSize";

export type SnapshotFrameImageProps = {
  imagePath: string | null;
  alt: string;
  canvasSize: SnapshotSize | null;
};

export const SnapshotFrameImage = ({ imagePath, alt, canvasSize }: SnapshotFrameImageProps) => {
  const imageSize = useCanvasSize([imagePath]);

  if (!imagePath) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Typography variant="caption">no preview</Typography>
      </div>
    );
  }

  return (
    <Image
      src={imagePath}
      alt={alt}
      className="absolute top-0 left-0 block h-auto"
      style={
        canvasSize && imageSize
          ? { width: `${(imageSize.width / canvasSize.width) * 100}%` }
          : undefined
      }
      errorFallback={
        <div className="absolute inset-0 flex items-center justify-center">
          <Typography variant="caption">failed to load snapshot</Typography>
        </div>
      }
    />
  );
};
