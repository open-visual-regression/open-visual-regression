"use client";

import { createContext, use, useCallback, useEffect, useId, useMemo, useState } from "react";

import { useAvailableHeight } from "@/lib/hooks/useAvailableHeight";

// Width the panes cap their images at. Left unset while it cannot be worked
// out, which resolves the classes below to no cap at all.
const FIT_WIDTH_VARIABLE = "--ovr-snapshot-fit-width";

/**
 * Caps a single pane so its image fits in the space left on screen. Only from
 * `lg` up: on a narrow screen there is no width to trade for height, and
 * scrolling a full width snapshot beats squinting at a thumbnail of it.
 */
export const FIT_WIDTH_CLASS = "mx-auto w-full lg:max-w-[var(--ovr-snapshot-fit-width)]";

/** Caps a pair of side by side panes at two images plus the `gap-4` between them. */
export const FIT_WIDTH_TWO_UP_CLASS =
  "mx-auto w-full lg:max-w-[calc(var(--ovr-snapshot-fit-width)*2+1rem)]";

// What a pane spends on chrome before the image itself: the `h-7` label row
// above it and the 1px border around it.
const PANE_CHROME_HEIGHT = 30;

// Past this there is not enough image left to review, so it is allowed to
// overflow and scroll instead.
const MIN_IMAGE_HEIGHT = 256;

type SnapshotFit = {
  reportAspectRatio: (id: string, aspectRatio: number | null) => void;
};

const SnapshotFitContext = createContext<SnapshotFit | null>(null);

/**
 * Reports one image's natural aspect ratio to the enclosing
 * `SnapshotFitProvider`, and drops it again when the image goes away.
 */
export const useReportAspectRatio = () => {
  const id = useId();
  const fit = use(SnapshotFitContext);
  const reportAspectRatio = fit?.reportAspectRatio;

  useEffect(() => () => reportAspectRatio?.(id, null), [id, reportAspectRatio]);

  return useCallback(
    (image: HTMLImageElement) => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        reportAspectRatio?.(id, image.naturalWidth / image.naturalHeight);
      }
    },
    [id, reportAspectRatio],
  );
};

/**
 * Fits the snapshots it wraps into the space left on screen. Snapshots are
 * rendered at the width of their pane, so a portrait one — a mobile viewport,
 * say — ends up several screens tall with only a sliver of it visible. Capping
 * the width of the panes instead of the height of the images keeps every
 * snapshot in the comparison at the same scale, which is the point of a
 * comparison.
 */
export const SnapshotFitProvider = ({ children }: { children: React.ReactNode }) => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  const availableHeight = useAvailableHeight(element);

  const reportAspectRatio = useCallback((id: string, aspectRatio: number | null) => {
    setAspectRatios((current) => {
      if (aspectRatio === null) {
        if (!(id in current)) {
          return current;
        }

        const { [id]: _removed, ...rest } = current;
        return rest;
      }

      return current[id] === aspectRatio ? current : { ...current, [id]: aspectRatio };
    });
  }, []);

  const fit = useMemo(() => ({ reportAspectRatio }), [reportAspectRatio]);

  // The tallest image for its width is the one that has to fit; every other
  // image is capped to the same width, so they all shrink together.
  const ratios = Object.values(aspectRatios);
  const imageHeight =
    availableHeight === null
      ? null
      : Math.max(availableHeight - PANE_CHROME_HEIGHT, MIN_IMAGE_HEIGHT);
  const fitWidth =
    imageHeight === null || ratios.length === 0
      ? null
      : Math.round(imageHeight * Math.min(...ratios));

  return (
    <div
      ref={setElement}
      style={
        fitWidth === null
          ? undefined
          : ({ [FIT_WIDTH_VARIABLE]: `${fitWidth}px` } as React.CSSProperties)
      }
    >
      <SnapshotFitContext value={fit}>{children}</SnapshotFitContext>
    </div>
  );
};
