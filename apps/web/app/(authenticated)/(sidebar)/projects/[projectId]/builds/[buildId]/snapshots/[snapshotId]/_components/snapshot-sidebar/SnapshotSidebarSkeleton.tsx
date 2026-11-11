"use client";

import { Skeleton } from "@ovr/ui/components/skeleton";

import { useSnapshotPreferences } from "@/lib/providers/SnapshotPreferencesProvider";

import { SnapshotSidebar } from "./SnapshotSidebar";

export const SnapshotSidebarSkeleton = () => {
  const { sidebarOpen } = useSnapshotPreferences();

  if (!sidebarOpen) {
    return null;
  }

  return (
    <SnapshotSidebar collapsed={false}>
      <div className="flex h-12 items-center gap-6 border-b border-border px-5">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="flex flex-col gap-3 p-3">
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
      </div>
    </SnapshotSidebar>
  );
};
