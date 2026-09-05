"use client";

import { createContext, use, useCallback, useEffect, useId, useMemo, useState } from "react";

import { useAvailableHeight } from "@/lib/hooks/useAvailableHeight";

// The height an image box may take up, and the width that keeps the tallest
// image inside it. Both are left unset while they cannot be worked out, which
// falls the classes below back to the sizing they had before.
const FIT_HEIGHT_VARIABLE = "--ovr-snapshot-fit-height";
const FIT_WIDTH_VARIABLE = "--ovr-snapshot-fit-width";

/**
 * Gives an image box the space left on screen and centres what it holds, so a
 * snapshot sits in the middle of the dotted backdrop rather than filling it.
 */
export const FIT_BOX_CLASS =
  "flex min-h-64 items-center justify-center lg:min-h-[var(--ovr-snapshot-fit-height,24rem)]";

/**
 * Holds an image to the width that keeps it inside its box. Only from `lg` up:
 * on a narrow screen there is no width to trade for height, and scrolling a
 * full width snapshot beats squinting at a thumbnail of it.
 */
export const FIT_IMAGE_CLASS = "lg:max-w-[min(100%,var(--ovr-snapshot-fit-width,100%))]";

// The `h-7` label row above the image box, and the 1px border around it.
const PANE_HEADER_HEIGHT = 28;
const BOX_BORDER_HEIGHT = 2;

// Past this there is not enough image left to review, so it is allowed to
// overflow and scroll instead.
const MIN_BOX_HEIGHT = 256;

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
 * say — ends up several screens tall with only a sliver of it visible. The
 * boxes keep their full width and take the height that is left, and the images
 * are held to the width that keeps the tallest of them inside that height, so
 * every snapshot in the comparison stays at the same scale.
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

  // The tallest image for its width is the one that has to fit; holding every
  // other image to the same width keeps them all at one scale.
  const ratios = Object.values(aspectRatios);
  const boxHeight =
    availableHeight === null
      ? null
      : Math.max(availableHeight - PANE_HEADER_HEIGHT, MIN_BOX_HEIGHT);
  const fitWidth =
    boxHeight === null || ratios.length === 0
      ? null
      : // Rounded down, so the image it is derived from cannot end up a fraction
        // of a pixel taller than the box holding it.
        Math.floor((boxHeight - BOX_BORDER_HEIGHT) * Math.min(...ratios));

  const fitStyle = {
    ...(boxHeight === null ? {} : { [FIT_HEIGHT_VARIABLE]: `${boxHeight}px` }),
    ...(fitWidth === null ? {} : { [FIT_WIDTH_VARIABLE]: `${fitWidth}px` }),
  } as React.CSSProperties;

  return (
    <div ref={setElement} style={fitStyle}>
      <SnapshotFitContext value={fit}>{children}</SnapshotFitContext>
    </div>
  );
};
