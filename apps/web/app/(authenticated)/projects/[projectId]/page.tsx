import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { z } from "zod";

import { buildStatusSchema } from "@ovr/api/contracts/builds";
import { Icon, SettingsIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { getBuildStatusLabel } from "@/lib/components/BuildStatus";
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

const searchParamsSchema = z.object({
  search: z.string().optional().catch(undefined),
  status: z.preprocess(toArray, z.array(buildStatusSchema)).optional().catch(undefined),
  branch: z.preprocess(toArray, z.array(z.string())).optional().catch(undefined),
  author: z.preprocess(toArray, z.array(z.string())).optional().catch(undefined),
});

export default async function ProjectPage(props: ProjectPageProps) {
  const { projectId } = await props.params;
  const {
    search,
    status: statuses = [],
    branch: branches = [],
    author: authors = [],
  } = searchParamsSchema.parse(await props.searchParams);

  const [projectError, projectResult] = await serverClient.projects.getOne({ projectId });

  if (projectError?.status === 404) {
    notFound();
  }

  if (projectError) {
    serverError();
  }

  const queryClient = getQueryClient();

  const [statusesResult, branchesResult, authorsResult] = await Promise.all([
    queryClient.fetchQuery(orpcServer.builds.listStatuses.queryOptions({ input: { projectId } })),
    queryClient.fetchQuery(
      orpcServer.builds.listBranches.queryOptions({ input: { projectId, search: undefined } }),
    ),
    queryClient.fetchQuery(
      orpcServer.builds.listAuthors.queryOptions({ input: { projectId, search: undefined } }),
    ),
    queryClient.prefetchInfiniteQuery(
      orpcServer.builds.list.infiniteOptions(
        buildsListInfiniteOptions(projectId, search, { statuses, branches, authors }),
      ),
    ),
  ]);

  const statusOptions = statusesResult.statuses.map((status) => ({
    value: status,
    label: getBuildStatusLabel(status),
  }));
  const branchOptions = branchesResult.branches.map((branch) => ({
    value: branch,
    label: branch,
  }));
  const authorOptions = authorsResult.authors.map((author) => ({
    value: author,
    label: author,
  }));

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Typography variant="h1" as="h1" className="w-full min-w-0 truncate md:w-auto md:flex-1">
          {projectResult.project.name}
        </Typography>
        <ButtonLink href={`/projects/${projectId}/settings`} variant="outline" color="neutral">
          <Icon icon={SettingsIcon} />
          project settings
        </ButtonLink>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BuildsFilters
          projectId={projectId}
          statuses={statuses}
          branches={branches}
          authors={authors}
          statusOptions={statusOptions}
          branchOptions={branchOptions}
          authorOptions={authorOptions}
        />
        <BuildsSearchField
          projectId={projectId}
          search={search}
          className="min-w-0 flex-1 lg:w-64 lg:flex-none"
        />
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BuildsSection
          projectId={projectId}
          search={search}
          statuses={statuses}
          branches={branches}
          authors={authors}
        />
      </HydrationBoundary>
    </div>
  );
}
