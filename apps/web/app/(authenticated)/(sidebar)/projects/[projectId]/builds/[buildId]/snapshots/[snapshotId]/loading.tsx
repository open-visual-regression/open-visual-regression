import { Suspense } from "react";

import { Skeleton } from "@ovr/ui/components/skeleton";

import { SnapshotActionsRowSkeleton } from "./_components/snapshot-actions/SnapshotActionsRow";
import { SnapshotHeaderSkeleton } from "./_components/snapshot-header/SnapshotHeader";
import { SnapshotShell } from "./_components/snapshot-layout/SnapshotShell";
import { SnapshotSidebarSkeleton } from "./_components/snapshot-sidebar/SnapshotSidebarSkeleton";

export default function Loading() {
  return (
    <SnapshotShell
      actions={<SnapshotActionsRowSkeleton />}
      sidebar={
        // The sidebar's open state comes from a cookie, which a prerendered shell can't read.
        // Until it can, show the default: collapsed, which takes no space.
        <Suspense fallback={null}>
          <SnapshotSidebarSkeleton />
        </Suspense>
      }
    >
      <SnapshotHeaderSkeleton />
      <Skeleton className="min-h-0 flex-1 rounded-card" />
    </SnapshotShell>
  );
}
