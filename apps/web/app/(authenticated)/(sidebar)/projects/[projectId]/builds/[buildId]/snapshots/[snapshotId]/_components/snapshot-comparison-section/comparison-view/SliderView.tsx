"use client";

import { ReactCompareSlider } from "react-compare-slider";

import { Typography } from "@ovr/ui/components/typography";

import { BaselineCommitLink } from "../../snapshot-pane/BaselineCommitLink";
import { DiffOverlay } from "../../snapshot-pane/DiffOverlay";
import { SnapshotFrameImage } from "../../snapshot-pane/SnapshotFrameImage";
import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneCanvas } from "../../snapshot-pane/SnapshotPaneCanvas";
import { SnapshotPaneFrame } from "../../snapshot-pane/SnapshotPaneFrame";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";
import type {
  BaselineSnapshotPaneData,
  DiffImages,
  SnapshotPaneData,
  SnapshotSize,
} from "../../snapshot-pane/types";
import { useCanvasSize, useIsCanvasSizePending } from "../../snapshot-pane/useCanvasSize";

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

type SliderItemProps = SnapshotPaneData & {
  diffImagePath: string | null;
  showDiff: boolean;
  canvasSize: SnapshotSize | null;
};

/** One side of the slider: a snapshot with its diff overlay over it. */
const SliderItem = ({ imagePath, alt, diffImagePath, showDiff, canvasSize }: SliderItemProps) => (
  <div className="relative h-full w-full">
    <SnapshotFrameImage imagePath={imagePath} alt={alt} canvasSize={canvasSize} />
    {diffImagePath ? (
      <DiffOverlay
        imagePath={diffImagePath}
        alt={`diff overlay of ${alt}`}
        canvasSize={canvasSize}
        visible={showDiff}
      />
    ) : null}
  </div>
);

export type SliderViewProps = {
  baseline: BaselineSnapshotPaneData;
  newSnapshot: SnapshotPaneData;
  diffImages: DiffImages;
  showDiff: boolean;
};

export const SliderView = ({ baseline, newSnapshot, diffImages, showDiff }: SliderViewProps) => {
  const imagePaths = [baseline.imagePath, newSnapshot.imagePath];
  const canvasSize = useCanvasSize(imagePaths);
  const pending = useIsCanvasSizePending(imagePaths);

  return (
    <SnapshotPane>
      <SnapshotPaneHeader className="justify-between">
        <div className="flex items-center gap-2">
          <Typography variant="label">baseline</Typography>
          <BaselineCommitLink commitSha={baseline.commitSha} commitUrl={baseline.commitUrl} />
        </div>
        <Typography variant="label">new</Typography>
      </SnapshotPaneHeader>
      <SnapshotPaneCanvas pending={pending}>
        <SnapshotPaneFrame canvasSize={canvasSize}>
          <ReactCompareSlider
            className="h-full w-full cursor-ew-resize [&_[role=slider]:focus-visible_[data-grip]]:ring-2 [&_[role=slider]:focus-visible_[data-grip]]:ring-ovr-fg [&_[role=slider]:focus-visible_[data-grip]]:ring-offset-2 [&_[role=slider]:focus-visible_[data-grip]]:ring-offset-ovr-inset"
            handle={<SliderHandle />}
            itemOne={
              <SliderItem
                imagePath={baseline.imagePath}
                alt={baseline.alt}
                diffImagePath={diffImages.baseline}
                showDiff={showDiff}
                canvasSize={canvasSize}
              />
            }
            itemTwo={
              <SliderItem
                imagePath={newSnapshot.imagePath}
                alt={newSnapshot.alt}
                diffImagePath={diffImages.newSnapshot}
                showDiff={showDiff}
                canvasSize={canvasSize}
              />
            }
          />
        </SnapshotPaneFrame>
      </SnapshotPaneCanvas>
    </SnapshotPane>
  );
};
