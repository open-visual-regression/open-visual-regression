"use client";

import {
  SegmentedTabs,
  SegmentedTabsList,
  SegmentedTabsTrigger,
} from "@ovr/ui/components/segmented-tabs";

import { useComparisonMode, type ViewMode } from "./comparison-mode";

export const ComparisonControls = () => {
  const { viewMode, setViewMode } = useComparisonMode();

  return (
    <div className="flex w-full items-center justify-end gap-4 sm:ml-auto sm:w-auto">
      <SegmentedTabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <SegmentedTabsList>
          <SegmentedTabsTrigger value="split">split</SegmentedTabsTrigger>
          <SegmentedTabsTrigger value="slider">slider</SegmentedTabsTrigger>
        </SegmentedTabsList>
      </SegmentedTabs>
    </div>
  );
};
