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

export const useCanvasSize = (imagePaths: (string | null)[]) =>
  useQueries({
    queries: imagePaths
      .filter((imagePath) => imagePath !== null)
      .map((imagePath) => ({
        queryKey: ["image-size", imagePath],
        queryFn: () => loadImageSize(imagePath),
        staleTime: Infinity,
        retry: false,
      })),
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
