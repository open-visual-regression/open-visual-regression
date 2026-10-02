"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { TransformComponent, useControls, useTransformContext } from "react-zoom-pan-pinch";

import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

// react-zoom-pan-pinch zooms additively (scale += deltaY * step), which makes a single wheel
// notch jump from 185% to 5%. Zoom exponentially instead, with each event's delta clamped so a
// free-spinning wheel (e.g. MX Master) can't leap, e.g. a 100 deltaY notch is ~22% per event.
const WHEEL_ZOOM_SPEED = 0.002;
const MAX_WHEEL_DELTA = 100;
const WHEEL_LINE_HEIGHT = 16;

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
  const { fitToView, zoomToPoint } = useControls();
  const { wrapperComponent, state } = useTransformContext();
  const [imageWidth, setImageWidth] = useState<number | null>(null);
  const [diffSize, setDiffSize] = useState<Size | null>(null);

  const isReady = diffImagePath ? imageWidth !== null && diffSize !== null : imageWidth !== null;

  const fitOnReady = useEffectEvent(() => fitToView({ maxScale: 1, animationTime: 0 }));

  useEffect(() => {
    if (isReady) {
      fitOnReady();
    }
  }, [isReady]);

  const hasImage = imagePath !== null;

  useEffect(() => {
    if (!wrapperComponent) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * WHEEL_LINE_HEIGHT
          : event.deltaY;
      const clamped = Math.max(-MAX_WHEEL_DELTA, Math.min(MAX_WHEEL_DELTA, delta));
      zoomToPoint(
        state.scale * Math.exp(-clamped * WHEEL_ZOOM_SPEED),
        event.clientX,
        event.clientY,
        0,
      );
    };

    wrapperComponent.addEventListener("wheel", handleWheel, { passive: false });
    return () => wrapperComponent.removeEventListener("wheel", handleWheel);
  }, [wrapperComponent, hasImage, state, zoomToPoint]);

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
