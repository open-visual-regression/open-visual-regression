"use client";

import { useControls, useTransformComponent } from "react-zoom-pan-pinch";

import { Button } from "@ovr/ui/components/button";
import { DialogClose, DialogTitle } from "@ovr/ui/components/dialog";
import { Icon, MinusIcon, PlusIcon, ScanIcon, XIcon } from "@ovr/ui/components/icon";
import {
  SegmentedTabs,
  SegmentedTabsList,
  SegmentedTabsTrigger,
} from "@ovr/ui/components/segmented-tabs";
import { Switch } from "@ovr/ui/components/switch";
import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";

import { BaselineCommitLink } from "../snapshot-pane/BaselineCommitLink";
import type { BaselineSnapshotPaneData } from "../snapshot-pane/types";
import type { SnapshotZoomView } from "./snapshot-zoom";

const BUTTON_ZOOM_RATIO = 1.25;

export type SnapshotZoomToolbarProps = {
  view: SnapshotZoomView;
  onViewChange: (view: SnapshotZoomView) => void;
  baseline: BaselineSnapshotPaneData | null;
  hasDiff: boolean;
  showDiff: boolean;
  onShowDiffChange: (showDiff: boolean) => void;
};

export const SnapshotZoomToolbar = ({
  view,
  onViewChange,
  baseline,
  hasDiff,
  showDiff,
  onShowDiffChange,
}: SnapshotZoomToolbarProps) => {
  const { zoomIn, zoomOut, centerView, fitToView } = useControls();
  const scale = useTransformComponent(({ state }) => state.scale);

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-1 gap-y-2 border-b border-ovr-border-subtle px-2 py-2 sm:gap-x-4 sm:px-4">
      <div className={cn("mr-auto flex items-center gap-2", baseline && "w-full sm:w-auto")}>
        <DialogTitle className={cn(baseline && "sr-only")}>
          <Typography variant="label">{view}</Typography>
        </DialogTitle>
        {baseline ? (
          <SegmentedTabs
            value={view}
            onValueChange={(value) => onViewChange(value as SnapshotZoomView)}
          >
            <SegmentedTabsList>
              <SegmentedTabsTrigger value="baseline">baseline</SegmentedTabsTrigger>
              <SegmentedTabsTrigger value="new">new</SegmentedTabsTrigger>
            </SegmentedTabsList>
          </SegmentedTabs>
        ) : null}
        {baseline && view === "baseline" ? (
          <BaselineCommitLink commitSha={baseline.commitSha} commitUrl={baseline.commitUrl} />
        ) : null}
      </div>
      {hasDiff ? (
        <label className="flex items-center gap-2">
          <Typography variant="caption">diff</Typography>
          <Switch
            checked={showDiff}
            disabled={view === "baseline"}
            onCheckedChange={onShowDiffChange}
          />
        </label>
      ) : null}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          color="neutral"
          size="icon-sm"
          aria-label="zoom out"
          onClick={() => zoomOut(scale * (1 - 1 / BUTTON_ZOOM_RATIO))}
        >
          <Icon icon={MinusIcon} size={12} />
        </Button>
        <Typography variant="num" className="min-w-[4ch] text-center text-label" role="status">
          {Math.round(scale * 100)}%
        </Typography>
        <Button
          variant="ghost"
          color="neutral"
          size="icon-sm"
          aria-label="zoom in"
          onClick={() => zoomIn(scale * (BUTTON_ZOOM_RATIO - 1))}
        >
          <Icon icon={PlusIcon} size={12} />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          className="px-1.5 sm:px-2.5"
          onClick={() => centerView(1)}
        >
          100%
        </Button>
        <ResponsiveActionButton
          icon={ScanIcon}
          variant="ghost"
          onClick={() => fitToView({ maxScale: 1 })}
        >
          fit
        </ResponsiveActionButton>
      </div>
      <DialogClose
        render={<Button variant="ghost" color="neutral" size="icon-sm" aria-label="close" />}
      >
        <Icon icon={XIcon} size={12} />
      </DialogClose>
    </div>
  );
};
