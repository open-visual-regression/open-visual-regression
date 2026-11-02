import { TypographySkeleton } from "@ovr/ui/components/typography";

import { FacetBarSkeleton } from "@/lib/components/facet/FacetBar";
import { SnapshotGridSkeleton } from "@/lib/components/snapshot-grid/SnapshotGrid";

import { SnapshotsPageShell } from "./_components/SnapshotsPageShell";

export default function Loading() {
  return (
    <SnapshotsPageShell
      heading={<TypographySkeleton variant="h1" className="w-32" />}
      filters={<FacetBarSkeleton facets={2} />}
      content={<SnapshotGridSkeleton />}
    />
  );
}
