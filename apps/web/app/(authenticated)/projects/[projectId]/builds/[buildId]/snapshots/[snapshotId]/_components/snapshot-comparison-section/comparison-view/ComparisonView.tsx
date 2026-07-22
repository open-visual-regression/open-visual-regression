"use client";

import { useComparisonMode } from "./comparison-mode";
import { SliderView } from "./SliderView";
import { SplitView } from "./SplitView";

export type ComparisonViewProps = {
  baselineImagePath: string | null;
  baselineAlt: string;
  newImagePath: string | null;
  newAlt: string;
  diffImagePath: string | null;
};

export const ComparisonView = ({
  baselineImagePath,
  baselineAlt,
  newImagePath,
  newAlt,
  diffImagePath,
}: ComparisonViewProps) => {
  const { viewMode, showDiff } = useComparisonMode();

  if (viewMode === "slider") {
    return (
      <SliderView
        baselineImagePath={baselineImagePath}
        baselineAlt={baselineAlt}
        newImagePath={newImagePath}
        newAlt={newAlt}
      />
    );
  }

  return (
    <SplitView
      baselineImagePath={baselineImagePath}
      baselineAlt={baselineAlt}
      newImagePath={newImagePath}
      newAlt={newAlt}
      diffImagePath={diffImagePath}
      showDiff={showDiff}
    />
  );
};
