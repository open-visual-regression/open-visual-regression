import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { z } from "zod";

import { Icon, SettingsIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { buildsListInfiniteOptions } from "@/lib/orpc/builds-query";
import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { BuildsSearchField } from "./_components/builds-section/BuildsSearchField";
import { BuildsSection } from "./_components/builds-section/BuildsSection";

type ProjectPageProps = PageProps<"/projects/[projectId]">;

const searchParamsSchema = z.object({
  search: z.string().optional().catch(undefined),
});

export default async function ProjectPage(props: ProjectPageProps) {
  const { projectId } = await props.params;
  const { search } = searchParamsSchema.parse(await props.searchParams);
  const queryClient = getQueryClient();

  const [[projectError, projectResult]] = await Promise.all([
    serverClient.projects.getOne({ projectId }),
    queryClient.prefetchInfiniteQuery(
      orpcServer.builds.list.infiniteOptions(buildsListInfiniteOptions(projectId, search)),
    ),
  ]);

  if (projectError?.status === 404) {
    notFound();
  }

  if (projectError) {
    serverError();
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
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
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BuildsSection projectId={projectId} search={search} />
      </HydrationBoundary>
    </div>
  );
}
