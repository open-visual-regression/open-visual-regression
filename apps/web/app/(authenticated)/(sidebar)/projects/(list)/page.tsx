import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getCachedSession } from "@/lib/auth/session";
import { projectsListInfiniteOptions } from "@/lib/orpc/projects-query";
import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { NewProjectButton } from "../_components/new-project-button/NewProjectButton";
import { ProjectsHeading } from "../_components/ProjectsHeading";
import { ProjectsPageShell } from "../_components/ProjectsPageShell";
import { ProjectsSection } from "../_components/ProjectsSection";

export default async function ProjectsPage() {
  const queryClient = getQueryClient();

  const [[countError, countResult], sessionResult] = await Promise.all([
    serverClient.projects.count(),
    getCachedSession(),
    queryClient.prefetchInfiniteQuery(
      orpcServer.projects.list.infiniteOptions(projectsListInfiniteOptions()),
    ),
  ]);

  if (countError) {
    serverError(countError);
  }

  const { total } = countResult;

  return (
    <ProjectsPageShell
      heading={<ProjectsHeading total={total} />}
      action={<NewProjectButton role={sessionResult?.user.role} />}
      content={
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ProjectsSection role={sessionResult?.user.role} />
        </HydrationBoundary>
      }
    />
  );
}
