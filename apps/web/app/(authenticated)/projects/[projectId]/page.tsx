import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { z } from "zod";

import { buildStatusSchema, viewportSchema } from "@ovr/api/contracts/builds";
import { Icon, SettingsIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { buildsListInfiniteOptions } from "@/lib/orpc/builds-query";
import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { BuildsFilters } from "./_components/builds-section/BuildsFilters";
import { BuildsSearchField } from "./_components/builds-section/BuildsSearchField";
import { BuildsSection } from "./_components/builds-section/BuildsSection";

type ProjectPageProps = PageProps<"/projects/[projectId]">;

const toArray = (value: string | string[] | undefined) =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];

const resolutionKeySchema = z.string().regex(/^\d+x\d+$/);

const searchParamsSchema = z.object({
  search: z.string().optional().catch(undefined),
  status: z.preprocess(toArray, z.array(buildStatusSchema)).optional().catch(undefined),
  browser: z.preprocess(toArray, z.array(viewportSchema.shape.browser)).optional().catch(undefined),
  resolution: z.preprocess(toArray, z.array(resolutionKeySchema)).optional().catch(undefined),
});

const parseResolutionKey = (key: string) => {
  const [viewportWidth, viewportHeight] = key.split("x").map(Number);
  return { viewportWidth: viewportWidth!, viewportHeight: viewportHeight! };
};

export default async function ProjectPage(props: ProjectPageProps) {
  const { projectId } = await props.params;
  const {
    search,
    status = [],
    browser = [],
    resolution = [],
  } = searchParamsSchema.parse(await props.searchParams);
  const resolutions = resolution.map(parseResolutionKey);
  const queryClient = getQueryClient();

  const [[projectError, projectResult], [, resolutionsResult]] = await Promise.all([
    serverClient.projects.getOne({ projectId }),
    serverClient.builds.listResolutions({ projectId }),
    queryClient.prefetchInfiniteQuery(
      orpcServer.builds.list.infiniteOptions(
        buildsListInfiniteOptions(projectId, search, {
          statuses: status,
          browsers: browser,
          resolutions,
        }),
      ),
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
        <div className="order-3 flex w-full items-center gap-2 lg:order-2 lg:ml-auto lg:w-auto">
          <BuildsFilters
            status={status}
            browser={browser}
            resolution={resolution}
            resolutionOptions={resolutionsResult?.resolutions ?? []}
          />
          <BuildsSearchField
            projectId={projectId}
            search={search}
            className="min-w-0 flex-1 lg:w-64 lg:flex-none"
          />
        </div>
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
        <BuildsSection
          projectId={projectId}
          search={search}
          status={status}
          browser={browser}
          resolutions={resolutions}
        />
      </HydrationBoundary>
    </div>
  );
}
