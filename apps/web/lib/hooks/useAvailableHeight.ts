"use client";

import { useCallback, useLayoutEffect, useState } from "react";

import { useScrollContainer } from "@/lib/providers/ScrollContainer";

/**
 * The height between the top of `element` and the bottom of the scrollable
 * region it sits in, measured as if that region were scrolled to the top: the
 * space the element has to work with before it runs off the screen.
 *
 * `null` when there is nothing to measure against — before the first layout, or
 * when the element is rendered outside a `ScrollContainer`.
 */
export const useAvailableHeight = (element: HTMLElement | null) => {
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);
  const scrollContainer = useScrollContainer();

  const measure = useCallback(() => {
    if (!element || !scrollContainer) {
      setAvailableHeight(null);
      return;
    }

    const offsetTop =
      element.getBoundingClientRect().top -
      scrollContainer.getBoundingClientRect().top +
      scrollContainer.scrollTop;
    const paddingBottom = Number.parseFloat(getComputedStyle(scrollContainer).paddingBottom) || 0;
    const height = scrollContainer.clientHeight - offsetTop - paddingBottom;

    setAvailableHeight((current) => (current === height ? current : height));
  }, [element, scrollContainer]);

  // Anything rendered above the element moves it, so re-measure on every render
  // rather than trying to guess which of them changed height.
  useLayoutEffect(measure);

  useLayoutEffect(() => {
    if (!scrollContainer) {
      return;
    }

    // Resizing the container both shrinks the space and reflows the content
    // above the element, which is what moves it in the first place.
    const observer = new ResizeObserver(measure);
    observer.observe(scrollContainer);

    return () => observer.disconnect();
  }, [scrollContainer, measure]);

  return availableHeight;
};
