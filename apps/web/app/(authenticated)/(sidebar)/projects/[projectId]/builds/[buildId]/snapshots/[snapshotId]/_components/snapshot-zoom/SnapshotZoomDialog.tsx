"use client";

import { useState } from "react";
import { TransformWrapper } from "react-zoom-pan-pinch";

import { Button } from "@ovr/ui/components/button";
import { Dialog, DialogContent, DialogTrigger } from "@ovr/ui/components/dialog";
import { Icon, Maximize2Icon } from "@ovr/ui/components/icon";

import { SnapshotZoomToolbar } from "./SnapshotZoomToolbar";
import { SnapshotZoomViewport } from "./SnapshotZoomViewport";

// The library zooms additively (scale += step * |deltaY|), so a fixed step jumps from 185% to 5% in
// one wheel notch. Scaling the step by the current zoom makes each notch (~100 deltaY) a ~20% change.
const WHEEL_ZOOM_STEP = 0.002;

export type SnapshotZoomDialogProps = {
  title: string;
  imagePath: string | null;
  alt: string;
  diffImagePath?: string | null;
  commitSha?: string | null;
  commitUrl?: string | null;
};

export const SnapshotZoomDialog = ({
  title,
  imagePath,
  alt,
  diffImagePath = null,
  commitSha = null,
  commitUrl = null,
}: SnapshotZoomDialogProps) => {
  const [showDiff, setShowDiff] = useState(true);
  const [scale, setScale] = useState(1);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            color="neutral"
            size="icon-xs"
            className="ml-auto shrink-0"
            aria-label={`zoom ${title}`}
          />
        }
        disabled={!imagePath}
      >
        <Icon icon={Maximize2Icon} size={10} />
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="top-0 left-0 flex h-dvh w-screen max-w-none rounded-none sm:top-4 sm:left-4 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:rounded-xl translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <TransformWrapper
          minScale={0.05}
          maxScale={16}
          limitToBounds={false}
          centerOnInit
          wheel={{ step: WHEEL_ZOOM_STEP * scale }}
          onTransform={(_, state) => setScale(state.scale)}
        >
          <SnapshotZoomToolbar
            title={title}
            commitSha={commitSha}
            commitUrl={commitUrl}
            hasDiff={diffImagePath !== null}
            showDiff={showDiff}
            onShowDiffChange={setShowDiff}
          />
          <div className="min-h-0 flex-1 overflow-hidden bg-ovr-inset">
            <SnapshotZoomViewport
              imagePath={imagePath}
              diffImagePath={diffImagePath}
              alt={alt}
              showDiff={showDiff}
            />
          </div>
        </TransformWrapper>
      </DialogContent>
    </Dialog>
  );
};
