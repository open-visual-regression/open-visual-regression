"use client";

import { ReactCompareSlider } from "react-compare-slider";

import { Typography } from "@ovr/ui/components/typography";

import { BaselineCommitLink } from "../../snapshot-pane/BaselineCommitLink";
import { SnapshotFrameImage } from "../../snapshot-pane/SnapshotFrameImage";
import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneCanvas } from "../../snapshot-pane/SnapshotPaneCanvas";
import { SnapshotPaneFrame } from "../../snapshot-pane/SnapshotPaneFrame";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";
import type { BaselineSnapshotPaneData, SnapshotPaneData } from "../../snapshot-pane/types";
import { useCanvasSize } from "../../snapshot-pane/useCanvasSize";

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

export const SliderView = ({ baseline, newSnapshot }: SliderViewProps) => {
  const canvasSize = useCanvasSize([baseline.imagePath, newSnapshot.imagePath]);

  return (
    <SnapshotPane>
      <SnapshotPaneHeader className="justify-between">
        <div className="flex items-center gap-2">
          <Typography variant="label">baseline</Typography>
          <BaselineCommitLink commitSha={baseline.commitSha} commitUrl={baseline.commitUrl} />
        </div>
        <Typography variant="label">new</Typography>
      </SnapshotPaneHeader>
      <SnapshotPaneCanvas className="lg:@container-size">
        <SnapshotPaneFrame canvasSize={canvasSize} fill>
          <ReactCompareSlider
            className="h-full w-full cursor-ew-resize [&_[role=slider]:focus-visible_[data-grip]]:ring-2 [&_[role=slider]:focus-visible_[data-grip]]:ring-ovr-fg [&_[role=slider]:focus-visible_[data-grip]]:ring-offset-2 [&_[role=slider]:focus-visible_[data-grip]]:ring-offset-ovr-inset"
            handle={<SliderHandle />}
            itemOne={
              <SnapshotFrameImage
                imagePath={baseline.imagePath}
                alt={baseline.alt}
                canvasSize={canvasSize}
              />
            }
            itemTwo={
              <SnapshotFrameImage
                imagePath={newSnapshot.imagePath}
                alt={newSnapshot.alt}
                canvasSize={canvasSize}
              />
            }
          />
        </SnapshotPaneFrame>
      </SnapshotPaneCanvas>
    </SnapshotPane>
  );
};
