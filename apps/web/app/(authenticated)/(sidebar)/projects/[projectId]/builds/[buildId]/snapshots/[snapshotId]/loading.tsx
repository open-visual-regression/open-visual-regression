import { Skeleton } from "@ovr/ui/components/skeleton";

import { SnapshotActionsRowSkeleton } from "./_components/snapshot-actions/SnapshotActionsRow";
import { SnapshotHeaderSkeleton } from "./_components/snapshot-header/SnapshotHeader";
import { SnapshotShell } from "./_components/snapshot-layout/SnapshotShell";
import { SnapshotSidebarPlaceholder } from "./_components/snapshot-layout/SnapshotSidebarPlaceholder";

export default function Loading() {
  return (
    <SnapshotShell
      actions={<SnapshotActionsRowSkeleton />}
      sidebar={<SnapshotSidebarPlaceholder />}
    >
      <SnapshotHeaderSkeleton />
      <Skeleton className="min-h-0 flex-1 rounded-card" />
    </SnapshotShell>
  );
}
