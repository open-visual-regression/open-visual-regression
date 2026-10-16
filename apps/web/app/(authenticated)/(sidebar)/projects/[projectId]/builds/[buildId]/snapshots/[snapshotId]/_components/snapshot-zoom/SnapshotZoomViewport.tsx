"use client";

import { useEffect, useEffectEvent } from "react";
import { TransformComponent, useControls } from "react-zoom-pan-pinch";

import { cn } from "@ovr/ui/lib/utils";

import { SnapshotFrameImage } from "../snapshot-pane/SnapshotFrameImage";
import type { BaselineSnapshotPaneData, SnapshotPaneData } from "../snapshot-pane/types";
import { useCanvasSize } from "../snapshot-pane/useCanvasSize";
import type { SnapshotZoomView } from "./snapshot-zoom";

export type SnapshotZoomViewportProps = {
  view: SnapshotZoomView;
  baseline: BaselineSnapshotPaneData | null;
  newSnapshot: SnapshotPaneData;
  diffImagePath: string | null;
  showDiff: boolean;
};

export const SnapshotZoomViewport = ({
  view,
  baseline,
  newSnapshot,
  diffImagePath,
  showDiff,
}: SnapshotZoomViewportProps) => {
  const { fitToView } = useControls();
  const canvasSize = useCanvasSize([baseline?.imagePath ?? null, newSnapshot.imagePath]);

  const isReady = canvasSize !== null;

  const fitOnReady = useEffectEvent(() => fitToView({ maxScale: 1, animationTime: 0 }));

  useEffect(() => {
    if (isReady) {
      fitOnReady();
    }
  }, [isReady]);

  return (
    <TransformComponent
      wrapperClass="h-full! w-full! cursor-grab active:cursor-grabbing"
      contentClass="bg-pixel-grid"
    >
      <div
        className="relative"
        style={canvasSize ? { width: canvasSize.width, height: canvasSize.height } : undefined}
      >
        {baseline ? (
          <SnapshotFrameImage
            imagePath={baseline.imagePath}
            alt={baseline.alt}
            canvasSize={canvasSize}
            className={cn(view !== "baseline" && "invisible")}
          />
        ) : null}
        <SnapshotFrameImage
          imagePath={newSnapshot.imagePath}
          alt={newSnapshot.alt}
          canvasSize={canvasSize}
          className={cn(view !== "new" && "invisible")}
        />
        {diffImagePath ? (
          <img
            src={diffImagePath}
            alt={`diff overlay of ${newSnapshot.alt}`}
            draggable={false}
            className={cn(
              "absolute inset-0 block size-full select-none",
              view === "new" && showDiff ? "opacity-100" : "opacity-0",
            )}
          />
        ) : null}
      </div>
    </TransformComponent>
  );
};
