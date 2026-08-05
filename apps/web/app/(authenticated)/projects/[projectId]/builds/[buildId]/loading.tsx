import { FacetBarSkeleton } from "@/lib/components/facet/FacetBar";
import { SearchFieldSkeleton } from "@/lib/components/SearchField/SearchField";

import { BuildHeaderSkeleton } from "./_components/build-header/BuildHeader";
import { BuildPageShell } from "./_components/BuildPageShell";
import { SnapshotGridSkeleton } from "./_components/snapshot-grid/SnapshotGrid";

export default function Loading() {
  return (
    <BuildPageShell
      header={<BuildHeaderSkeleton />}
      filters={<FacetBarSkeleton />}
      search={<SearchFieldSkeleton className="min-w-0 flex-1 lg:w-64 lg:flex-none" />}
      grid={<SnapshotGridSkeleton />}
    />
  );
}
