"use client";

import { ReactCompareSlider } from "react-compare-slider";

import { Typography } from "@ovr/ui/components/typography";

import { Image } from "@/lib/components/image/Image";

import { BaselineCommitLink } from "../../snapshot-pane/BaselineCommitLink";
import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneCanvas } from "../../snapshot-pane/SnapshotPaneCanvas";
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

const SliderImage = ({ imagePath, alt }: SliderImageProps) => (
  <div className="flex h-full w-full items-start justify-start">
    {imagePath ? (
      <Image
        src={imagePath}
        alt={alt}
        className="block h-auto w-full lg:max-h-full lg:w-auto lg:max-w-full"
        errorFallback={
          <Typography variant="caption" className="m-auto">
            failed to load snapshot
          </Typography>
        }
      />
    ) : (
      <Typography variant="caption" className="m-auto">
        no preview
      </Typography>
    )}
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
    <SnapshotPaneCanvas>
      <ReactCompareSlider
        className="h-full w-full cursor-ew-resize [&_[role=slider]:focus-visible_[data-grip]]:ring-2 [&_[role=slider]:focus-visible_[data-grip]]:ring-ovr-fg [&_[role=slider]:focus-visible_[data-grip]]:ring-offset-2 [&_[role=slider]:focus-visible_[data-grip]]:ring-offset-ovr-inset"
        handle={<SliderHandle />}
        itemOne={<SliderImage imagePath={baseline.imagePath} alt={baseline.alt} />}
        itemTwo={<SliderImage imagePath={newSnapshot.imagePath} alt={newSnapshot.alt} />}
      />
    </SnapshotPaneCanvas>
  </SnapshotPane>
);
