import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";

import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { auth } from "@/lib/auth/auth";
import { RequiresAdminRole } from "@/lib/components/authorization/RequiresAdminRole";
import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { projectsListInfiniteOptions } from "@/lib/orpc/projects-query";
import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { ProjectsPageShell } from "../_components/ProjectsPageShell";
import { ProjectsSection } from "../_components/ProjectsSection";

export default async function ProjectsPage() {
  const queryClient = getQueryClient();

  const [[countError, countResult], sessionResult] = await Promise.all([
    serverClient.projects.count(),
    auth.api.getSession({ headers: await headers() }),
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
      heading={
        <div className="flex flex-row gap-2 items-end-safe">
          <Typography variant="h1" as="h1">
            projects
          </Typography>
          <Typography variant="h2" className="text-muted-foreground" as="p">
            ({total})
          </Typography>
        </div>
      }
      action={
        <RequiresAdminRole role={sessionResult?.user.role}>
          <ButtonLink href="/projects/new">
            <Icon icon={PlusIcon} />
            new project
          </ButtonLink>
        </RequiresAdminRole>
      }
      content={
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ProjectsSection role={sessionResult?.user.role} />
        </HydrationBoundary>
      }
    />
  );
}
