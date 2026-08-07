"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export type GridMetrics = {
  columns: number;
  rowHeight: number;
  scrollMargin: number;
  scrollElement: HTMLElement;
};

const findScrollElement = (element: HTMLElement): HTMLElement | null => {
  let candidate = element.parentElement;

  while (candidate) {
    const { overflowY } = getComputedStyle(candidate);
    if (overflowY === "auto" || overflowY === "scroll") {
      return candidate;
    }
    candidate = candidate.parentElement;
  }

  return null;
};

const isSame = (a: GridMetrics | null, b: GridMetrics) =>
  a !== null &&
  a.columns === b.columns &&
  a.rowHeight === b.rowHeight &&
  a.scrollMargin === b.scrollMargin &&
  a.scrollElement === b.scrollElement;

export const useGridMetrics = (ref: RefObject<HTMLElement | null>): GridMetrics | null => {
  const [metrics, setMetrics] = useState<GridMetrics | null>(null);

  useLayoutEffect(() => {
    const grid = ref.current;

    if (!grid || typeof ResizeObserver === "undefined") {
      return;
    }

    const measure = () => {
      const style = getComputedStyle(grid);
      const columns = style.gridTemplateColumns.split(" ").filter(Boolean).length;
      const rowGap = Number.parseFloat(style.rowGap);
      const card = grid.firstElementChild;
      const cardHeight = card instanceof HTMLElement ? card.offsetHeight : 0;
      const scrollElement = findScrollElement(grid);

      if (columns < 1 || cardHeight < 1 || !Number.isFinite(rowGap) || !scrollElement) {
        setMetrics(null);
        return;
      }

      const next: GridMetrics = {
        columns,
        rowHeight: cardHeight + rowGap,
        scrollMargin:
          grid.getBoundingClientRect().top -
          scrollElement.getBoundingClientRect().top +
          scrollElement.scrollTop,
        scrollElement,
      };

      setMetrics((current) => (isSame(current, next) ? current : next));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    const scrollElement = findScrollElement(grid);
    if (scrollElement) {
      observer.observe(scrollElement);
    }

    return () => observer.disconnect();
  }, [ref]);

  return metrics;
};
