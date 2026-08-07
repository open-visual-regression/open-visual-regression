"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export type GridColumns = {
  columns: number;
  gap: number;
};

export const useGridColumns = (ref: RefObject<HTMLElement | null>): GridColumns | null => {
  const [columns, setColumns] = useState<GridColumns | null>(null);

  useLayoutEffect(() => {
    const grid = ref.current;

    if (!grid || typeof ResizeObserver === "undefined") {
      return;
    }

    const measure = () => {
      const style = getComputedStyle(grid);
      const next = {
        columns: style.gridTemplateColumns.split(" ").filter(Boolean).length,
        gap: Number.parseFloat(style.rowGap),
      };

      if (next.columns < 1 || !Number.isFinite(next.gap)) {
        setColumns(null);
        return;
      }

      setColumns((current) =>
        current?.columns === next.columns && current.gap === next.gap ? current : next,
      );
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(grid);

    return () => observer.disconnect();
  }, [ref]);

  return columns;
};
