import { Skeleton } from "@ovr/ui/components/skeleton";
import { TypographySkeleton } from "@ovr/ui/components/typography";

import { ProjectCardsListSkeleton } from "../_components/ProjectCardsList";
import { ProjectsPageShell } from "../_components/ProjectsPageShell";

export default function Loading() {
  return (
    <ProjectsPageShell
      heading={<TypographySkeleton variant="h1" className="w-32" />}
      action={<Skeleton className="h-8 w-28 rounded-md" />}
      content={<ProjectCardsListSkeleton />}
    />
  );
}
