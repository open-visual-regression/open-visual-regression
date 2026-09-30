"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { TransformComponent, useControls } from "react-zoom-pan-pinch";

import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

export type SnapshotZoomViewportProps = {
  imagePath: string | null;
  diffImagePath: string | null;
  alt: string;
  showDiff: boolean;
};

type Size = { width: number; height: number };

export const SnapshotZoomViewport = ({
  imagePath,
  diffImagePath,
  alt,
  showDiff,
}: SnapshotZoomViewportProps) => {
  const { fitToView } = useControls();
  const [imageWidth, setImageWidth] = useState<number | null>(null);
  const [diffSize, setDiffSize] = useState<Size | null>(null);

  const isReady = diffImagePath ? imageWidth !== null && diffSize !== null : imageWidth !== null;

  const fitOnReady = useEffectEvent(() => fitToView({ maxScale: 1, animationTime: 0 }));

  useEffect(() => {
    if (isReady) {
      fitOnReady();
    }
  }, [isReady]);

  if (!imagePath) {
    return (
      <div className="flex h-full items-center justify-center">
        <Typography variant="caption">no preview</Typography>
      </div>
    );
  }

  const imageWidthPercent =
    diffSize && imageWidth ? `${(imageWidth / diffSize.width) * 100}%` : undefined;

  return (
    <TransformComponent
      wrapperClass="h-full! w-full! cursor-grab active:cursor-grabbing"
      contentClass="bg-pixel-grid"
    >
      <div className="relative">
        <img
          src={imagePath}
          alt={alt}
          draggable={false}
          className={cn("block max-w-none select-none", diffImagePath && "absolute top-0 left-0")}
          style={diffImagePath ? { width: imageWidthPercent } : undefined}
          onLoad={(event) => setImageWidth(event.currentTarget.naturalWidth)}
        />
        {diffImagePath ? (
          <img
            src={diffImagePath}
            alt={`diff overlay of ${alt}`}
            draggable={false}
            className={cn(
              "relative block max-w-none select-none",
              showDiff ? "opacity-100" : "opacity-0",
            )}
            onLoad={(event) =>
              setDiffSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
          />
        ) : null}
      </div>
    </TransformComponent>
  );
};
