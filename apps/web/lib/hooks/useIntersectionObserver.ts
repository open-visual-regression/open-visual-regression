import { useEffect, useRef } from "react";

type UseIntersectionObserverOptions = {
  /** Invoked whenever the observed element becomes visible. */
  onIntersect: () => void;
  /** When false, the observer is disconnected and never fires. */
  enabled?: boolean;
  /** The scrolling element used as the observer viewport. */
  root?: Element | null;
  /** Grow the root's bounding box so loading starts before the sentinel shows. */
  rootMargin?: string;
};

/**
 * Observes a sentinel element and calls `onIntersect` when it scrolls into view.
 * Returns a ref to attach to the element that should be watched.
 */
export const useIntersectionObserver = <T extends Element>({
  onIntersect,
  enabled = true,
  root = null,
  rootMargin = "0px",
}: UseIntersectionObserverOptions) => {
  const targetRef = useRef<T>(null);
  const onIntersectRef = useRef(onIntersect);
  onIntersectRef.current = onIntersect;

  useEffect(() => {
    const target = targetRef.current;

    if (!enabled || !target || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onIntersectRef.current();
          }
        }
      },
      { root, rootMargin },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [enabled, root, rootMargin]);

  return targetRef;
};
