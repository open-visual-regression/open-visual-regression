"use client";

import { useState } from "react";

import { cn } from "@ovr/ui/lib/utils";

import type { SnapshotSize } from "./types";
import { useCanvasSize } from "./useCanvasSize";

export type DiffOverlayProps = {
  imagePath: string;
  alt: string;
  canvasSize: SnapshotSize | null;
  visible: boolean;
};

/**
 * A diff overlay over its snapshot, sized to match it on the canvas. It stays
 * hidden until both sizes are known, so it never shows at the wrong size, and
 * shows nothing if it fails to load, leaving the snapshot as it is.
 */
export const DiffOverlay = ({ imagePath, alt, canvasSize, visible }: DiffOverlayProps) => {
  const overlaySize = useCanvasSize([imagePath]);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return null;
  }

  return (
    <img
      src={imagePath}
      alt={alt}
      draggable={false}
      onError={() => setFailed(true)}
      className={cn(
        "pointer-events-none absolute top-0 left-0 block h-auto select-none",
        (!visible || !overlaySize || !canvasSize) && "invisible",
      )}
      style={
        overlaySize && canvasSize
          ? { width: `${(overlaySize.width / canvasSize.width) * 100}%` }
          : undefined
      }
    />
  );
};
