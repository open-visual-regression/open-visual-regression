import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";
import { NoProjectsSection } from "./_components/NoProjectsSection";
import { router } from "@/lib/router";
import { redirect } from "next/navigation";
import { ProjectCardsList } from "./_components/ProjectCardsList";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { RequiresAdminRole } from "@/lib/components/authorization/RequiresAdminRole";

export default async function ProjectsPage() {
  const [[error, listProjectsResult], sessionResult] = await Promise.all([
    router.projects.list(),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (error) {
    redirect("/error");
  }

  const { projects } = listProjectsResult;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-row gap-2 items-end-safe">
          <Typography variant="h1" as="h1">
            projects
          </Typography>
          <Typography variant="h2" className="text-muted-foreground" as="p">
            ({projects.length})
          </Typography>
        </div>
        <RequiresAdminRole role={sessionResult?.user.role}>
          <ButtonLink href="/projects/new" size="lg">
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
