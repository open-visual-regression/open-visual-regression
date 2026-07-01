import { useEffect, useRef } from "react";

type UseIntersectionObserverOptions = {
  onIntersect: () => void;
  enabled?: boolean;
  root?: Element | null;
  rootMargin?: string;
};

// Returns a ref for the element to watch; calls onIntersect as it scrolls into view.
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
