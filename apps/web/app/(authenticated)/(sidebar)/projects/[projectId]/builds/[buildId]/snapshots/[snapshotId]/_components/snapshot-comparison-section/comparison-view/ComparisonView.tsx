"use client";

import type { BaselineSnapshotPaneData, SnapshotPaneData } from "../../snapshot-pane/types";
import { useComparisonMode } from "./comparison-mode";
import { SliderView } from "./SliderView";
import { SplitView } from "./SplitView";

export type ComparisonViewProps = {
  baseline: BaselineSnapshotPaneData;
  newSnapshot: SnapshotPaneData;
  diffImagePath: string | null;
};

export const ComparisonView = ({ baseline, newSnapshot, diffImagePath }: ComparisonViewProps) => {
  const { viewMode, showDiff } = useComparisonMode();

  if (viewMode === "slider") {
    return <SliderView baseline={baseline} newSnapshot={newSnapshot} />;
  }

  return (
    <SplitView
      baseline={baseline}
      newSnapshot={newSnapshot}
      diffImagePath={diffImagePath}
      showDiff={showDiff}
    />
  );
};
