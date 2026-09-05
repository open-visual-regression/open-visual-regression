"use client";

import { ReactCompareSlider } from "react-compare-slider";

import { Typography } from "@ovr/ui/components/typography";

import { Image } from "@/lib/components/image/Image";

import { BaselineCommitLink } from "../../snapshot-pane/BaselineCommitLink";
import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";
import type { BaselineSnapshotPaneData, SnapshotPaneData } from "../../snapshot-pane/types";

// Amber accent divider with a square handle showing the drag glyph. The focus
// ring is driven by the focusable slider root that wraps this handle. That
// slider root has pointer-events disabled (react-compare-slider only
// re-enables dragging from within the handle on touch devices), so the
// visible pieces below need pointer-events-auto or touch drags fall through
// to the images underneath and the slider becomes unresponsive on mobile.
const SliderHandle = () => (
  <div className="flex h-full cursor-ew-resize flex-col items-center">
    <div className="pointer-events-auto w-0.5 grow bg-ovr-accent" />
    <div
      data-grip
      className="pointer-events-auto flex size-9 items-center justify-center rounded-lg bg-ovr-accent text-xl leading-none font-semibold text-ovr-on-accent"
    >
      ↔
    </div>
    <div className="pointer-events-auto w-0.5 grow bg-ovr-accent" />
  </div>
);

export type SliderViewProps = {
  baseline: BaselineSnapshotPaneData;
  newSnapshot: SnapshotPaneData;
};

type SliderImageProps = {
  imagePath: string | null;
  alt: string;
};

// Both images share the container width and are top-aligned so the comparison
// stays lined up even when the baseline and new snapshots differ in height.
const SliderImage = ({ imagePath, alt }: SliderImageProps) =>
  imagePath ? (
    <Image
      src={imagePath}
      alt={alt}
      className="block h-auto w-full"
      errorFallback={
        <div className="flex min-h-64 items-center justify-center lg:min-h-96">
          <Typography variant="caption">failed to load snapshot</Typography>
        </div>
      }
    />
  ) : (
    <div className="flex min-h-64 items-center justify-center lg:min-h-96">
      <Typography variant="caption">no preview</Typography>
    </div>
  );

export const SliderView = ({ baseline, newSnapshot }: SliderViewProps) => (
  <SnapshotPane>
    <SnapshotPaneHeader className="justify-between">
      <div className="flex items-center gap-2">
        <Typography variant="label">baseline</Typography>
        <BaselineCommitLink commitSha={baseline.commitSha} commitUrl={baseline.commitUrl} />
      </div>
      <Typography variant="label">new</Typography>
    </SnapshotPaneHeader>
    <ReactCompareSlider
      className="min-h-64 cursor-ew-resize overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid lg:min-h-96 [&_[role=slider]:focus-visible_[data-grip]]:ring-2 [&_[role=slider]:focus-visible_[data-grip]]:ring-ovr-fg [&_[role=slider]:focus-visible_[data-grip]]:ring-offset-2 [&_[role=slider]:focus-visible_[data-grip]]:ring-offset-ovr-inset"
      handle={<SliderHandle />}
      itemOne={<SliderImage imagePath={baseline.imagePath} alt={baseline.alt} />}
      itemTwo={<SliderImage imagePath={newSnapshot.imagePath} alt={newSnapshot.alt} />}
    />
  </SnapshotPane>
);
