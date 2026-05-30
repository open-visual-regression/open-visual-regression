import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";
import { NoProjectsSection } from "./_components/NoProjectsSection";
import { router } from "@/lib/router";
import { redirect } from "next/navigation";
import { ProjectCardsList } from "./_components/ProjectCardsList";

export default async function ProjectsPage() {
  const [error, listProjectsResult] = await router.projects.list();

  if (error) {
    console.error(error);
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
            ({projects.length ?? 0})
          </Typography>
        </div>
        <ButtonLink href="/projects/new" size="lg">
          <Icon icon={PlusIcon} />
          new project
        </ButtonLink>
      </div>
      {projects.length === 0 ? (
        <NoProjectsSection />
      ) : (
        <ProjectCardsList projects={projects ?? []} />
      )}
    </div>
  );
}
