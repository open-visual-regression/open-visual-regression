"use client";

import { useQueries } from "@tanstack/react-query";

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

const imageSizeQueries = (imagePaths: (string | null)[]) =>
  imagePaths
    .filter((imagePath) => imagePath !== null)
    .map((imagePath) => ({
      queryKey: ["image-size", imagePath],
      queryFn: () => loadImageSize(imagePath),
      staleTime: Infinity,
      retry: false,
    }));

export const useCanvasSize = (imagePaths: (string | null)[]) =>
  useQueries({
    queries: imageSizeQueries(imagePaths),
    combine: (results): SnapshotSize | null => {
      const sizes = results.flatMap(({ data }) => (data ? [data] : []));

      if (sizes.length === 0 || results.some(({ isPending }) => isPending)) {
        return null;
      }

      return {
        width: Math.max(...sizes.map(({ width }) => width)),
        height: Math.max(...sizes.map(({ height }) => height)),
      };
    },
  });

/**
 * Whether any of the images is still loading, so the canvas size isn't known yet.
 * False once every image has loaded or failed, and when there are no images at all.
 */
export const useIsCanvasSizePending = (imagePaths: (string | null)[]) =>
  useQueries({
    queries: imageSizeQueries(imagePaths),
    combine: (results) => results.some(({ isPending }) => isPending),
  });
