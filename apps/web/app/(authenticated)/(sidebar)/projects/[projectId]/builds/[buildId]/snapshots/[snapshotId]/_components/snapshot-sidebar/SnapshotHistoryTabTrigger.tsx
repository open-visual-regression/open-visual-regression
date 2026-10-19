"use client";

import { TabsTrigger } from "@ovr/ui/components/tabs";

import { useSnapshotHistoryPrefetch } from "@/lib/orpc/useSnapshotHistoryPrefetch";

type SnapshotHistoryTabTriggerProps = {
  snapshotId: string;
};

export const SnapshotHistoryTabTrigger = ({ snapshotId }: SnapshotHistoryTabTriggerProps) => {
  const prefetchHistory = useSnapshotHistoryPrefetch(snapshotId);

  return (
    <TabsTrigger
      className="px-5"
      value="history"
      onPointerEnter={prefetchHistory}
      onPointerDown={prefetchHistory}
      onFocus={prefetchHistory}
    >
      History
    </TabsTrigger>
  );
};
