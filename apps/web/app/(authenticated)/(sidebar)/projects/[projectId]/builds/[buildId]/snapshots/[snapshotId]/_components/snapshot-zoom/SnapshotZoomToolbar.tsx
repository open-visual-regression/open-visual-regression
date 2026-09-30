"use client";

import { useControls, useTransformComponent } from "react-zoom-pan-pinch";

import { Button } from "@ovr/ui/components/button";
import { DialogClose, DialogTitle } from "@ovr/ui/components/dialog";
import { Icon, MinusIcon, PlusIcon, ScanIcon, XIcon } from "@ovr/ui/components/icon";
import { Switch } from "@ovr/ui/components/switch";
import { Typography } from "@ovr/ui/components/typography";

import { BaselineCommitLink } from "../snapshot-pane/BaselineCommitLink";

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
    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-ovr-border-subtle px-4 py-2">
      <div className="mr-auto flex items-center gap-2">
        <DialogTitle>
          <Typography variant="label">{title}</Typography>
        </DialogTitle>
        <BaselineCommitLink commitSha={commitSha} commitUrl={commitUrl} />
      </div>
      {hasDiff ? (
        <label className="flex items-center gap-2">
          <Typography variant="caption">show diff</Typography>
          <Switch checked={showDiff} onCheckedChange={onShowDiffChange} />
        </label>
      ) : null}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          color="neutral"
          size="icon-sm"
          aria-label="zoom out"
          onClick={() => zoomOut()}
        >
          <Icon icon={MinusIcon} size={12} />
        </Button>
        <Typography variant="num" className="min-w-9 text-center text-label" role="status">
          {Math.round(scale * 100)}%
        </Typography>
        <Button
          variant="ghost"
          color="neutral"
          size="icon-sm"
          aria-label="zoom in"
          onClick={() => zoomIn()}
        >
          <Icon icon={PlusIcon} size={12} />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" color="neutral" size="sm" onClick={() => centerView(1)}>
          100%
        </Button>
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          onClick={() => fitToView({ maxScale: 1 })}
        >
          <Icon icon={ScanIcon} size={12} />
          fit
        </Button>
      </div>
      <DialogClose
        render={<Button variant="ghost" color="neutral" size="icon-sm" aria-label="close" />}
      >
        <Icon icon={XIcon} size={12} />
      </DialogClose>
    </div>
  );
};
