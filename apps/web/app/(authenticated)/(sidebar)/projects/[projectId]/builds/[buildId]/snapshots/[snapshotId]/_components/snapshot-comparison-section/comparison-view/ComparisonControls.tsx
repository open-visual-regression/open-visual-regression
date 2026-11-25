"use client";

import {
  SegmentedTabs,
  SegmentedTabsList,
  SegmentedTabsTrigger,
} from "@ovr/ui/components/segmented-tabs";
import { Switch } from "@ovr/ui/components/switch";
import { Typography } from "@ovr/ui/components/typography";

import { useComparisonMode, type ViewMode } from "./comparison-mode";

export type ComparisonControlsProps = {
  /** Whether the snapshot has a diff to show over the images. */
  hasDiff: boolean;
};

export const ComparisonControls = ({ hasDiff }: ComparisonControlsProps) => {
  const { viewMode, setViewMode, showDiff, setShowDiff } = useComparisonMode();

  return (
    <div className="flex w-full items-center justify-end gap-4 sm:ml-auto sm:w-auto">
      {hasDiff ? (
        <label className="flex items-center gap-2">
          <Typography variant="caption">diff</Typography>
          <Switch checked={showDiff} onCheckedChange={setShowDiff} />
        </label>
      ) : null}
      <SegmentedTabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <SegmentedTabsList>
          <SegmentedTabsTrigger value="split">split</SegmentedTabsTrigger>
          <SegmentedTabsTrigger value="slider">slider</SegmentedTabsTrigger>
        </SegmentedTabsList>
      </SegmentedTabs>
    </div>
  );
};
