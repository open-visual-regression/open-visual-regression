import { Typography } from "@ovr/ui/components/typography";
import { serverClient } from "@/lib/router";
import { notFound } from "next/navigation";
import { serverError } from "@/lib/utils/errors";
import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { Icon, SettingsIcon } from "@ovr/ui/components/icon";
import { BuildsSection } from "./_components/builds-section/BuildsSection";

type ProjectPageProps = PageProps<"/projects/[projectId]">;

export default async function ProjectPage(props: ProjectPageProps) {
  const { projectId } = await props.params;

  const [[projectError, projectResult], [buildsError, buildsResult]] = await Promise.all([
    serverClient.projects.getOne({ projectId }),
    serverClient.builds.list({ projectIds: [projectId] }),
  ]);

  if (projectError?.status === 404) {
    notFound();
  }

  if (projectError || buildsError) {
    serverError();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row justify-between items-center">
        <Typography variant="h1" as="h1">
          {projectResult.project.name}
        </Typography>
        <ButtonLink href={`/projects/${projectId}/settings`} variant="outline" color="neutral">
          <Icon icon={SettingsIcon} />
          project settings
        </ButtonLink>
      </div>
      <BuildsSection builds={buildsResult.builds} />
    </div>
  );
}
