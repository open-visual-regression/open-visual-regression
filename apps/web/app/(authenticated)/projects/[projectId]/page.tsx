import { z } from "zod";
import { Typography } from "@ovr/ui/components/typography";
import { serverClient } from "@/lib/router";
import { notFound } from "next/navigation";
import { serverError } from "@/lib/utils/errors";
import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { Icon, SettingsIcon } from "@ovr/ui/components/icon";
import { BuildsSection } from "./_components/builds-section/BuildsSection";
import { BuildsSearchField } from "./_components/builds-section/BuildsSearchField";

type ProjectPageProps = PageProps<"/projects/[projectId]">;

const searchParamsSchema = z.object({
  search: z.string().optional().catch(undefined),
});

export default async function ProjectPage(props: ProjectPageProps) {
  const { projectId } = await props.params;
  const { search } = searchParamsSchema.parse(await props.searchParams);

  const [[projectError, projectResult], [buildsError, buildsResult]] = await Promise.all([
    serverClient.projects.getOne({ projectId }),
    serverClient.builds.list({ projectIds: [projectId], search }),
  ]);

  if (projectError?.status === 404) {
    notFound();
  }

  if (projectError || buildsError) {
    serverError();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Typography
          variant="h1"
          as="h1"
          className="order-1 w-full min-w-0 truncate md:w-auto md:flex-1"
        >
          {projectResult.project.name}
        </Typography>
        <BuildsSearchField
          projectId={projectId}
          search={search}
          className="order-3 w-full lg:order-2 lg:ml-auto lg:w-64"
        />
        <ButtonLink
          href={`/projects/${projectId}/settings`}
          variant="outline"
          color="neutral"
          className="order-2 w-full md:ml-auto md:w-auto lg:order-3 lg:ml-0"
        >
          <Icon icon={SettingsIcon} />
          project settings
        </ButtonLink>
      </div>
      <BuildsSection builds={buildsResult.builds} search={search} />
    </div>
  );
}
