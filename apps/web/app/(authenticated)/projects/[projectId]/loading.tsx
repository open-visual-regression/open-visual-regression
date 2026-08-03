import { FacetBarSkeleton } from "@/lib/components/facet/FacetBar";
import { SearchFieldSkeleton } from "@/lib/components/SearchField/SearchField";

import { BuildsTable } from "./_components/builds-section/BuildsTable";
import { ProjectHeaderSkeleton } from "./_components/project-header/ProjectHeader";
import { ProjectPageShell } from "./_components/ProjectPageShell";

export default function Loading() {
  return (
    <ProjectPageShell
      header={<ProjectHeaderSkeleton />}
      filters={<FacetBarSkeleton />}
      search={<SearchFieldSkeleton className="min-w-0 flex-1 lg:w-64 lg:flex-none" />}
      content={
        <BuildsTable
          data={[]}
          isLoading
          hasNextPage={false}
          isFetchingNextPage={false}
          onLoadMore={() => {}}
        />
      }
    />
  );
}
