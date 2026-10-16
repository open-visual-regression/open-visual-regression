"use client";

import { useEffect, useState } from "react";

import type { SnapshotSize } from "./types";

const loadImageSize = (imagePath: string) =>
  new Promise<SnapshotSize>((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight }),
    );
    image.addEventListener("error", reject);
    image.src = imagePath;
  });

// The smallest canvas that holds every image anchored to its top-left corner, matching how
// the worker pads snapshots of different sizes before diffing them.
export const useCanvasSize = (imagePaths: (string | null)[]) => {
  const key = imagePaths.join("\n");
  const [canvas, setCanvas] = useState<{ key: string; size: SnapshotSize | null } | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const loadablePaths = key.split("\n").filter((imagePath) => imagePath !== "");

    Promise.allSettled(loadablePaths.map(loadImageSize)).then((results) => {
      const sizes = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );

      if (isCurrent) {
        setCanvas({
          key,
          size:
            sizes.length > 0
              ? {
                  width: Math.max(...sizes.map((size) => size.width)),
                  height: Math.max(...sizes.map((size) => size.height)),
                }
              : null,
        });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [key]);

  return canvas?.key === key ? canvas.size : null;
};
