import { TypographySkeleton } from "@ovr/ui/components/typography";

import { FacetBarSkeleton } from "@/lib/components/facet/FacetBar";
import { SearchFieldSkeleton } from "@/lib/components/SearchField/SearchField";
import { SnapshotCardSkeleton } from "@/lib/components/snapshot-grid/SnapshotCard";
import { SnapshotGridSkeleton } from "@/lib/components/snapshot-grid/SnapshotGrid";

import { SnapshotsPageShell } from "./_components/SnapshotsPageShell";

export default function Loading() {
  return (
    <SnapshotsPageShell
      heading={<TypographySkeleton variant="h1" className="w-32" />}
      filters={<FacetBarSkeleton facets={6} />}
      search={<SearchFieldSkeleton className="min-w-0 flex-1 lg:w-64 lg:flex-none" />}
      content={<SnapshotGridSkeleton skeleton={<SnapshotCardSkeleton showProject />} />}
    />
  );
}
