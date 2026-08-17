"use client";

import { useComparisonMode } from "./comparison-mode";
import { SliderView } from "./SliderView";
import { SplitView } from "./SplitView";

export type ComparisonViewProps = {
  baselineImagePath: string | null;
  baselineAlt: string;
  baselineCommitSha: string | null;
  baselineCommitUrl: string | null;
  newImagePath: string | null;
  newAlt: string;
  diffImagePath: string | null;
};

export const ComparisonView = ({
  baselineImagePath,
  baselineAlt,
  baselineCommitSha,
  baselineCommitUrl,
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
        baselineCommitSha={baselineCommitSha}
        baselineCommitUrl={baselineCommitUrl}
        newImagePath={newImagePath}
        newAlt={newAlt}
      />
    );
  }

  return (
    <SplitView
      baselineImagePath={baselineImagePath}
      baselineAlt={baselineAlt}
      baselineCommitSha={baselineCommitSha}
      baselineCommitUrl={baselineCommitUrl}
      newImagePath={newImagePath}
      newAlt={newAlt}
      diffImagePath={diffImagePath}
      showDiff={showDiff}
    />
  );
};
