"use client";

import { useState } from "react";
import { TransformWrapper } from "react-zoom-pan-pinch";

import { Dialog, DialogContent } from "@ovr/ui/components/dialog";

import { useComparisonMode } from "../snapshot-comparison-section/comparison-view/comparison-mode";
import type { BaselineSnapshotPaneData, SnapshotPaneData } from "../snapshot-pane/types";
import { SnapshotZoomContext, type SnapshotZoomView } from "./snapshot-zoom";
import { SnapshotZoomToolbar } from "./SnapshotZoomToolbar";
import { SnapshotZoomViewport } from "./SnapshotZoomViewport";

const WHEEL_ZOOM_STEP = 0.002;

export type SnapshotZoomDialogProps = {
  baseline: BaselineSnapshotPaneData | null;
  newSnapshot: SnapshotPaneData;
  diffImagePath: string | null;
  children: React.ReactNode;
};

export const SnapshotZoomDialog = ({
  baseline,
  newSnapshot,
  diffImagePath,
  children,
}: SnapshotZoomDialogProps) => {
  const { showDiff, setShowDiff } = useComparisonMode();
  const [view, setView] = useState<SnapshotZoomView>("new");
  const [scale, setScale] = useState(1);

  return (
    <Dialog>
      <SnapshotZoomContext.Provider value={{ setView }}>{children}</SnapshotZoomContext.Provider>
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
            view={view}
            onViewChange={setView}
            baseline={baseline}
            hasDiff={diffImagePath !== null}
            showDiff={showDiff}
            onShowDiffChange={setShowDiff}
          />
          <div className="min-h-0 flex-1 overflow-hidden bg-ovr-inset">
            <SnapshotZoomViewport
              view={view}
              baseline={baseline}
              newSnapshot={newSnapshot}
              diffImagePath={diffImagePath}
              showDiff={showDiff}
            />
          </div>
        </TransformWrapper>
      </DialogContent>
    </Dialog>
  );
};
