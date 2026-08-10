"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { orpc } from "./client";

export const useReviewRefresh = (): (() => void) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: orpc.snapshots.key() });
    void queryClient.invalidateQueries({ queryKey: orpc.builds.key() });
    void queryClient.invalidateQueries({ queryKey: orpc.diffs.key() });
    router.refresh();
  }, [queryClient, router]);
};
