"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { z } from "zod";

import { useScrollPositionStore } from "@/lib/stores/scrollPositionStore";

const SCROLL_ID_ATTRIBUTE = "data-scroll-restoration-id";
const CONTAINER_SELECTOR = `[${SCROLL_ID_ATTRIBUTE}]`;
const HISTORY_ENTRY_KEY = "__ovrScrollKey";

const RESTORE_TIMEOUT_MS = 1_500;
const RESTORE_SETTLE_MS = 300;
const GESTURE_WINDOW_MS = 600;

const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

// `__NA` marks an entry the App Router has committed. Loose, so writing our key
// back does not strip Next's own internals from the entry.
const historyStateSchema = z.looseObject({
  __NA: z.literal(true),
  [HISTORY_ENTRY_KEY]: z.string().optional(),
});

// Keyed per entry rather than per URL, so a fresh navigation has nothing stored
// and starts at the top.
const getHistoryEntryKey = (): string | null => {
  const state = historyStateSchema.safeParse(window.history.state);
  if (!state.success) {
    return null;
  }
  if (state.data[HISTORY_ENTRY_KEY]) {
    return state.data[HISTORY_ENTRY_KEY];
  }

  const key = crypto.randomUUID();
  window.history.replaceState({ ...state.data, [HISTORY_ENTRY_KEY]: key }, "");
  return key;
};

/** Restores scroll for containers marked with `data-scroll-restoration-id`. */
export const useScrollRestoration = () => {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  const restoringRef = useRef(new Map<string, () => void>());
  // Restoring on the first render could only happen after hydration, so after
  // the first paint. Traversals only.
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    // The router scrolls these containers too, via `scrollIntoView()` on the
    // committed segment, including on the way out of a page — so only save
    // scrolling we can attribute to the user.
    let lastGestureAt = Number.NEGATIVE_INFINITY;
    let isPointerDown = false;

    const onGesture = () => {
      lastGestureAt = performance.now();
    };
    // Pressing a link ends the gesture; its navigation scroll lands just after.
    const onPointerDown = () => {
      isPointerDown = true;
      lastGestureAt = Number.NEGATIVE_INFINITY;
    };
    const onPointerUp = () => {
      isPointerDown = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      lastGestureAt = SCROLL_KEYS.has(event.key) ? performance.now() : Number.NEGATIVE_INFINITY;
    };

    const onScroll = (event: Event) => {
      const isUserScrolling =
        isPointerDown || performance.now() - lastGestureAt < GESTURE_WINDOW_MS;
      const container = event.target;
      if (!isUserScrolling || !(container instanceof Element)) {
        return;
      }

      const id = container.getAttribute(SCROLL_ID_ATTRIBUTE);
      const entryKey = id && !restoringRef.current.has(id) ? getHistoryEntryKey() : null;
      if (id && entryKey) {
        useScrollPositionStore.getState().save(entryKey, id, container.scrollTop);
      }
    };

    // `scroll` does not bubble, so capture stands in for a listener per container.
    const options = { capture: true, passive: true } as const;
    document.addEventListener("scroll", onScroll, options);
    document.addEventListener("wheel", onGesture, options);
    document.addEventListener("touchmove", onGesture, options);
    document.addEventListener("pointerdown", onPointerDown, options);
    document.addEventListener("pointerup", onPointerUp, options);
    document.addEventListener("keydown", onKeyDown, options);

    return () => {
      document.removeEventListener("scroll", onScroll, options);
      document.removeEventListener("wheel", onGesture, options);
      document.removeEventListener("touchmove", onGesture, options);
      document.removeEventListener("pointerdown", onPointerDown, options);
      document.removeEventListener("pointerup", onPointerUp, options);
      document.removeEventListener("keydown", onKeyDown, options);
    };
  }, []);

  // Waits out content that is still arriving, then holds the offset briefly in
  // case the router scrolls a commit later. All before paint, so none of it shows.
  const restoreContainer = useCallback((container: Element, id: string, top: number) => {
    restoringRef.current.get(id)?.();

    let frame = 0;
    let lastScrollHeight = container.scrollHeight;
    let growthDeadline = performance.now() + RESTORE_TIMEOUT_MS;
    let reachedAt: number | null = null;

    const stop = () => {
      window.cancelAnimationFrame(frame);
      container.removeEventListener("wheel", stop);
      container.removeEventListener("touchstart", stop);
      container.removeEventListener("keydown", stop);
      if (restoringRef.current.get(id) === stop) {
        restoringRef.current.delete(id);
      }
    };

    const tick = () => {
      const now = performance.now();
      if (Math.abs(container.scrollTop - top) >= 1) {
        container.scrollTop = top;
      }

      if (Math.abs(container.scrollTop - top) < 1) {
        reachedAt ??= now;
        if (now - reachedAt >= RESTORE_SETTLE_MS) {
          stop();
          return;
        }
      } else {
        reachedAt = null;
        if (container.scrollHeight !== lastScrollHeight) {
          lastScrollHeight = container.scrollHeight;
          growthDeadline = now + RESTORE_TIMEOUT_MS;
        }
        if (now > growthDeadline) {
          stop();
          return;
        }
      }

      frame = window.requestAnimationFrame(tick);
    };

    restoringRef.current.set(id, stop);
    tick();

    // Never fight the user for the scroll position.
    container.addEventListener("wheel", stop, { passive: true, once: true });
    container.addEventListener("touchstart", stop, { passive: true, once: true });
    container.addEventListener("keydown", stop, { once: true });

    return stop;
  }, []);

  const restore = useCallback(() => {
    const entryKey = getHistoryEntryKey();
    if (!entryKey) {
      return;
    }

    const saved = useScrollPositionStore.getState().entries[entryKey] ?? {};
    const cleanups = Array.from(document.querySelectorAll(CONTAINER_SELECTOR)).flatMap(
      (container) => {
        const id = container.getAttribute(SCROLL_ID_ATTRIBUTE);
        const top = id ? saved[id] : undefined;
        return id && top ? [restoreContainer(container, id, top)] : [];
      },
    );

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [restoreContainer]);

  useLayoutEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    return restore();
  }, [pathname, search, restore]);

  // Traversal between two entries for the same URL leaves the deps above equal.
  useEffect(() => {
    const onPopState = () => restore();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [restore]);
};
