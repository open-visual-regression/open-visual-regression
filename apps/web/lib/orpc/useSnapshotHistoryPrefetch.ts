"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { orpc } from "./client";
import { snapshotHistoryInfiniteOptions } from "./snapshots-query";

export const useSnapshotHistoryPrefetch = (snapshotId: string): (() => void) => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    void queryClient.prefetchInfiniteQuery(
      orpc.snapshots.getHistory.infiniteOptions(snapshotHistoryInfiniteOptions(snapshotId)),
    );
  }, [queryClient, snapshotId]);
};
