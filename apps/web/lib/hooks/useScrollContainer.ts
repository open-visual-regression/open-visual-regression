"use client";

import { useEffect, useState, type RefObject } from "react";

export const useScrollContainer = (ref: RefObject<HTMLElement | null>): HTMLElement | null => {
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let candidate = ref.current?.parentElement ?? null;

    while (candidate) {
      const { overflowY } = getComputedStyle(candidate);
      if (overflowY === "auto" || overflowY === "scroll") {
        setScrollElement(candidate);
        return;
      }
      candidate = candidate.parentElement;
    }

    setScrollElement(null);
  }, [ref]);

  return scrollElement;
};
