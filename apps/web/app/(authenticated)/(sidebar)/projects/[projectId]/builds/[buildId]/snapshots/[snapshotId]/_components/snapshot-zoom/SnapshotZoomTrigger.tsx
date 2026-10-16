"use client";

import { DialogTrigger } from "@ovr/ui/components/dialog";

import { useSnapshotZoom, type SnapshotZoomView } from "./snapshot-zoom";

export type SnapshotZoomTriggerProps = {
  view: SnapshotZoomView;
  disabled?: boolean;
};

export const SnapshotZoomTrigger = ({ view, disabled }: SnapshotZoomTriggerProps) => {
  const { setView } = useSnapshotZoom();

  return (
    <DialogTrigger
      disabled={disabled}
      onClick={() => setView(view)}
      render={
        <button
          type="button"
          aria-label={`zoom ${view}`}
          className="absolute inset-0 cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-ovr-accent-ring focus-visible:ring-inset disabled:cursor-default"
        />
      }
    />
  );
};
