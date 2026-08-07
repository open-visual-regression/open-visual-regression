"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export type GridLayout = {
  columns: number;
  gap: number;
};

export const useGridLayout = (ref: RefObject<HTMLElement | null>): GridLayout | null => {
  const [layout, setLayout] = useState<GridLayout | null>(null);

  useLayoutEffect(() => {
    const grid = ref.current;

    if (!grid || typeof ResizeObserver === "undefined") {
      return;
    }

    const measure = () => {
      const style = getComputedStyle(grid);
      const columns = style.gridTemplateColumns.split(" ").filter(Boolean).length;
      const gap = Number.parseFloat(style.rowGap);

      setLayout((current) => {
        if (columns < 1 || !Number.isFinite(gap)) {
          return null;
        }
        return current?.columns === columns && current.gap === gap ? current : { columns, gap };
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(grid);

    return () => observer.disconnect();
  }, [ref]);

  return layout;
};
