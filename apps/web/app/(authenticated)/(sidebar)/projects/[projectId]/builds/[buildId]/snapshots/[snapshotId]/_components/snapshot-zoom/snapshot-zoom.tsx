"use client";

import { createContext, useContext } from "react";

export type SnapshotZoomView = "baseline" | "new";

type SnapshotZoom = {
  setView: (view: SnapshotZoomView) => void;
};

export const SnapshotZoomContext = createContext<SnapshotZoom | null>(null);

export const useSnapshotZoom = () => {
  const context = useContext(SnapshotZoomContext);

  if (!context) {
    throw new Error("useSnapshotZoom must be used within a SnapshotZoomDialog");
  }

  return context;
};
