"use client";

import { useControls, useTransformComponent } from "react-zoom-pan-pinch";

import { Button } from "@ovr/ui/components/button";
import { DialogClose, DialogTitle } from "@ovr/ui/components/dialog";
import { Icon, MinusIcon, PlusIcon, ScanIcon, XIcon } from "@ovr/ui/components/icon";
import { Switch } from "@ovr/ui/components/switch";
import { Typography } from "@ovr/ui/components/typography";

import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";

import { BaselineCommitLink } from "../snapshot-pane/BaselineCommitLink";

// Button zoom is a constant ratio (zoomOut exactly undoes zoomIn): the library step is additive,
// so it is derived from the current scale.
const BUTTON_ZOOM_RATIO = 1.25;

export type SnapshotZoomToolbarProps = {
  title: string;
  commitSha: string | null;
  commitUrl: string | null;
  hasDiff: boolean;
  showDiff: boolean;
  onShowDiffChange: (showDiff: boolean) => void;
};

export const SnapshotZoomToolbar = ({
  title,
  commitSha,
  commitUrl,
  hasDiff,
  showDiff,
  onShowDiffChange,
}: SnapshotZoomToolbarProps) => {
  const { zoomIn, zoomOut, centerView, fitToView } = useControls();
  const scale = useTransformComponent(({ state }) => state.scale);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-1 gap-y-2 border-b border-ovr-border-subtle px-2 py-2 sm:gap-x-4 sm:px-4">
      <div className="mr-auto flex items-center gap-2">
        <DialogTitle>
          <Typography variant="label">{title}</Typography>
        </DialogTitle>
        <BaselineCommitLink commitSha={commitSha} commitUrl={commitUrl} />
      </div>
      {hasDiff ? (
        <label className="flex items-center gap-2">
          <Typography variant="caption">diff</Typography>
          <Switch checked={showDiff} onCheckedChange={onShowDiffChange} />
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
