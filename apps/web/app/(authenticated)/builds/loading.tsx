import { TypographySkeleton } from "@ovr/ui/components/typography";

import { BuildsListSkeleton } from "@/lib/components/builds-section/BuildsList";
import { FacetBarSkeleton } from "@/lib/components/facet/FacetBar";
import { SearchFieldSkeleton } from "@/lib/components/SearchField/SearchField";

import { BuildsPageShell } from "./_components/BuildsPageShell";

export default function Loading() {
  return (
    <BuildsPageShell
      heading={<TypographySkeleton variant="h1" className="w-24" />}
      filters={<FacetBarSkeleton />}
      search={<SearchFieldSkeleton className="min-w-0 flex-1 lg:w-64 lg:flex-none" />}
      content={<BuildsListSkeleton />}
    />
  );
}
