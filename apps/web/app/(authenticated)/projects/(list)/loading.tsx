import { Skeleton } from "@ovr/ui/components/skeleton";

import { ProjectCardsListSkeleton } from "../_components/ProjectCardsList";
import { ProjectsPageShell } from "../_components/ProjectsPageShell";

export default function Loading() {
  return (
    <ProjectsPageShell
      heading={<Skeleton className="h-7 w-32" />}
      action={<Skeleton className="h-8 w-28 rounded-md" />}
      content={<ProjectCardsListSkeleton />}
    />
  );
}
