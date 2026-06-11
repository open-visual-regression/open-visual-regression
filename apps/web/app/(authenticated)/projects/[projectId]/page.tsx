import { Typography } from "@ovr/ui/components/typography";
import { router } from "@/lib/router";
import { notFound } from "next/navigation";
import { serverError } from "@/lib/utils/errors";
import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { Icon, SettingsIcon } from "@ovr/ui/components/icon";

type ProjectPageProps = PageProps<"/projects/[projectId]">;

export default async function ProjectPage(props: ProjectPageProps) {
  const { projectId } = await props.params;

  const [error, result] = await router.projects.getOne({ projectId });

  if (error?.status === 404) {
    notFound();
  }

  if (error) {
    serverError();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row justify-between items-center">
        <Typography variant="h1" as="h1">
          {result.project.name}
        </Typography>
        <ButtonLink href={`/projects/${projectId}/settings`} variant="secondary">
          <Icon icon={SettingsIcon} />
          project settings
        </ButtonLink>
      </div>
      <div>Hello, World!</div>
    </div>
  );
}
