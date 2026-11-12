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

export const useImageSizes = (imagePaths: (string | null)[]) =>
  useQueries({
    queries: imagePaths
      .filter((imagePath) => imagePath !== null)
      .map((imagePath) => ({
        queryKey: ["image-size", imagePath],
        queryFn: () => loadImageSize(imagePath),
        staleTime: Infinity,
        retry: false,
      })),
    combine: (results): SnapshotSize[] | null => {
      if (results.some(({ isPending }) => isPending)) {
        return null;
      }

      return results.flatMap(({ data }) => (data ? [data] : []));
    },
  });

export const useCanvasSize = (imagePaths: (string | null)[]): SnapshotSize | null => {
  const sizes = useImageSizes(imagePaths);

  if (!sizes || sizes.length === 0) {
    return null;
  }

  return {
    width: Math.max(...sizes.map(({ width }) => width)),
    height: Math.max(...sizes.map(({ height }) => height)),
  };
};
