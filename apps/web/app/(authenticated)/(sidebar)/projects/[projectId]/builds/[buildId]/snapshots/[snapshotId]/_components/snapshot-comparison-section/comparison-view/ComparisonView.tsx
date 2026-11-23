"use client";

import type {
  BaselineSnapshotPaneData,
  DiffImages,
  SnapshotPaneData,
} from "../../snapshot-pane/types";
import { SnapshotZoomDialog } from "../../snapshot-zoom/SnapshotZoomDialog";
import { useComparisonMode } from "./comparison-mode";
import { SliderView } from "./SliderView";
import { SplitView } from "./SplitView";

export type ComparisonViewProps = {
  baseline: BaselineSnapshotPaneData;
  newSnapshot: SnapshotPaneData;
  diffImages: DiffImages;
};

export const ComparisonView = ({ baseline, newSnapshot, diffImages }: ComparisonViewProps) => {
  const { viewMode, showDiff } = useComparisonMode();

  if (viewMode === "slider") {
    return (
      <SliderView
        baseline={baseline}
        newSnapshot={newSnapshot}
        diffImages={diffImages}
        showDiff={showDiff}
      />
    );
  }

  return (
    <SnapshotZoomDialog baseline={baseline} newSnapshot={newSnapshot} diffImages={diffImages}>
      <SplitView
        baseline={baseline}
        newSnapshot={newSnapshot}
        diffImages={diffImages}
        showDiff={showDiff}
      />
    </SnapshotZoomDialog>
  );
};
