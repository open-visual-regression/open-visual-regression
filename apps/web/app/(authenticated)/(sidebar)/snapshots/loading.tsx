import { TypographySkeleton } from "@ovr/ui/components/typography";

import { SnapshotGridSkeleton } from "@/lib/components/snapshot-grid/SnapshotGrid";

import { SnapshotsPageShell } from "./_components/SnapshotsPageShell";

export default function Loading() {
  return (
    <SnapshotsPageShell
      heading={<TypographySkeleton variant="h1" className="w-32" />}
      content={<SnapshotGridSkeleton />}
    />
  );
}
