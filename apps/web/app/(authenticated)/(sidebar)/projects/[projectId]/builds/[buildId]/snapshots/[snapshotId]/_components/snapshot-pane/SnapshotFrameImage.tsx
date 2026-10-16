"use client";

import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { Image } from "@/lib/components/image/Image";

import type { SnapshotSize } from "./types";
import { useCanvasSize } from "./useCanvasSize";

export type SnapshotFrameImageProps = {
  imagePath: string | null;
  alt: string;
  canvasSize: SnapshotSize | null;
  className?: string;
};

export const SnapshotFrameImage = ({
  imagePath,
  alt,
  canvasSize,
  className,
}: SnapshotFrameImageProps) => {
  const imageSize = useCanvasSize([imagePath]);

  if (!imagePath) {
    return (
      <div className={cn("absolute inset-0 flex items-center justify-center", className)}>
        <Typography variant="caption">no preview</Typography>
      </div>
    );
  }

  return (
    <Image
      src={imagePath}
      alt={alt}
      draggable={false}
      className={cn("absolute top-0 left-0 block h-auto select-none", className)}
      style={
        canvasSize && imageSize
          ? { width: `${(imageSize.width / canvasSize.width) * 100}%` }
          : undefined
      }
      errorFallback={
        <div className={cn("absolute inset-0 flex items-center justify-center", className)}>
          <Typography variant="caption">failed to load snapshot</Typography>
        </div>
      }
    />
  );
};
