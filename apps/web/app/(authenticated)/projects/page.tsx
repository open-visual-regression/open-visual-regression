import { headers } from "next/headers";

import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { auth } from "@/lib/auth/auth";
import { RequiresAdminRole } from "@/lib/components/authorization/RequiresAdminRole";
import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { NoProjectsSection } from "./_components/NoProjectsSection";
import { ProjectCardsList } from "./_components/ProjectCardsList";

const PROJECTS_PAGE_LIMIT = 100;

export default async function ProjectsPage() {
  const [[listError, listProjectsResult], [countError, countResult], sessionResult] =
    await Promise.all([
      serverClient.projects.list({ limit: PROJECTS_PAGE_LIMIT }),
      serverClient.projects.count(),
      auth.api.getSession({ headers: await headers() }),
    ]);

  if (listError || countError) {
    serverError();
  }

  const { projects } = listProjectsResult;
  const { total } = countResult;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-row gap-2 items-end-safe">
          <Typography variant="h1" as="h1">
            projects
          </Typography>
          <Typography variant="h2" className="text-muted-foreground" as="p">
            ({total})
          </Typography>
        </div>
        <RequiresAdminRole role={sessionResult?.user.role}>
          <ButtonLink href="/projects/new">
            <Icon icon={PlusIcon} />
            new project
          </ButtonLink>
        </RequiresAdminRole>
      </div>
      {projects.length === 0 ? (
        <NoProjectsSection role={sessionResult?.user.role} />
      ) : (
        <ProjectCardsList projects={projects} />
      )}
    </div>
  );
}
