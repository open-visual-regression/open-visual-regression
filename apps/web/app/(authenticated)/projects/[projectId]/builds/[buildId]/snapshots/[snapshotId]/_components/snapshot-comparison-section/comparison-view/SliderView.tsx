"use client";

import { ReactCompareSlider } from "react-compare-slider";

import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { Image } from "@/lib/components/image/Image";

import { BaselineCommitLink } from "../../snapshot-pane/BaselineCommitLink";
import {
  FIT_BOX_CLASS,
  FIT_IMAGE_CLASS,
  useReportAspectRatio,
} from "../../snapshot-pane/snapshot-fit";
import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";
import type { BaselineSnapshotPaneData, SnapshotPaneData } from "../../snapshot-pane/types";

// Amber accent divider with a square handle showing the drag glyph. The focus
// ring is driven by the focusable slider root that wraps this handle.
const SliderHandle = () => (
  <div className="flex h-full cursor-ew-resize flex-col items-center">
    <div className="w-0.5 grow bg-ovr-accent" />
    <div
      data-grip
      className="flex size-9 items-center justify-center rounded-lg bg-ovr-accent text-xl leading-none font-semibold text-ovr-on-accent"
    >
      ↔
    </div>
    <div className="w-0.5 grow bg-ovr-accent" />
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
const SliderImage = ({ imagePath, alt }: SliderImageProps) => {
  const reportAspectRatio = useReportAspectRatio();

  return imagePath ? (
    <Image
      src={imagePath}
      alt={alt}
      onLoaded={reportAspectRatio}
      className="block h-auto w-full"
      errorFallback={
        <div className="flex min-h-64 items-center justify-center">
          <Typography variant="caption">failed to load snapshot</Typography>
        </div>
      }
    />
  ) : (
    <div className="flex min-h-64 items-center justify-center">
      <Typography variant="caption">no preview</Typography>
    </div>
  );
};

export const SliderView = ({ baseline, newSnapshot }: SliderViewProps) => (
  <SnapshotPane>
    <SnapshotPaneHeader className="justify-between">
      <div className="flex items-center gap-2">
        <Typography variant="label">baseline</Typography>
        <BaselineCommitLink commitSha={baseline.commitSha} commitUrl={baseline.commitUrl} />
      </div>
      <Typography variant="label">new</Typography>
    </SnapshotPaneHeader>
    <div
      className={cn(
        "overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid",
        FIT_BOX_CLASS,
      )}
    >
      {/* The slider sets its own `max-width` inline, so the fitted width goes
          on a wrapper it cannot overrule. */}
      <div className={cn("w-full", FIT_IMAGE_CLASS)}>
        <ReactCompareSlider
          className="w-full cursor-ew-resize [&_[role=slider]:focus-visible_[data-grip]]:ring-2 [&_[role=slider]:focus-visible_[data-grip]]:ring-ovr-fg [&_[role=slider]:focus-visible_[data-grip]]:ring-offset-2 [&_[role=slider]:focus-visible_[data-grip]]:ring-offset-ovr-inset"
          handle={<SliderHandle />}
          itemOne={<SliderImage imagePath={baseline.imagePath} alt={baseline.alt} />}
          itemTwo={<SliderImage imagePath={newSnapshot.imagePath} alt={newSnapshot.alt} />}
        />
      </div>
    </div>
  </SnapshotPane>
);
