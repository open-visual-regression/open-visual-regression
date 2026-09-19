import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";

import { toRole } from "@/lib/auth/roles";
import { getCachedSession } from "@/lib/auth/session";
import { BuildsFilters } from "@/lib/components/builds-section/BuildsFilters";
import { BuildsSearchField } from "@/lib/components/builds-section/BuildsSearchField";
import { parseBuildsSearchParams } from "@/lib/components/builds-section/buildsSearchParams";
import { BuildsSection } from "@/lib/components/builds-section/BuildsSection";
import { getBuildStatusLabel } from "@/lib/components/BuildStatus";
import { buildsListInfiniteOptions } from "@/lib/orpc/builds-query";
import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { NoBuildsSection } from "./_components/builds-section/NoBuildsSection";
import { ProjectHeader } from "./_components/project-header/ProjectHeader";
import { ProjectPageShell } from "./_components/ProjectPageShell";

type ProjectPageProps = PageProps<"/projects/[projectId]">;

export default async function ProjectPage(props: ProjectPageProps) {
  const { projectId } = await props.params;
  const rawSearchParams = await props.searchParams;
  const { search, statuses, branches, authors } = parseBuildsSearchParams(rawSearchParams);

  const [projectError, projectResult] = await serverClient.projects.getOne({ projectId });

  if (projectError?.status === 404) {
    notFound();
  }

  if (projectError) {
    serverError(projectError);
  }

  const queryClient = getQueryClient();

  const [session, statusesResult, branchesResult, authorsResult] = await Promise.all([
    getCachedSession(),
    queryClient.fetchQuery(orpcServer.builds.listStatuses.queryOptions({ input: { projectId } })),
    queryClient.fetchQuery(
      orpcServer.builds.listBranches.queryOptions({ input: { projectId, search: undefined } }),
    ),
    queryClient.fetchQuery(
      orpcServer.builds.listAuthors.queryOptions({ input: { projectId, search: undefined } }),
    ),
    queryClient.prefetchInfiniteQuery(
      orpcServer.builds.list.infiniteOptions(
        buildsListInfiniteOptions({
          projectIds: [projectId],
          search,
          statuses,
          branches,
          authors,
        }),
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
    <ProjectPageShell
      header={
        <ProjectHeader
          projectId={projectId}
          projectName={projectResult.project.name}
          role={toRole(session?.user.role)}
        />
      }
      filters={
        <BuildsFilters
          projectId={projectId}
          statuses={statuses}
          branches={branches}
          authors={authors}
          statusOptions={statusOptions}
          branchOptions={branchOptions}
          authorOptions={authorOptions}
        />
      }
      search={
        <BuildsSearchField
          projectId={projectId}
          search={search}
          searchParams={rawSearchParams}
          className="min-w-0 flex-1 lg:w-64 lg:flex-none"
        />
      }
      content={
        <HydrationBoundary state={dehydrate(queryClient)}>
          <BuildsSection
            projectIds={[projectId]}
            search={search}
            statuses={statuses}
            branches={branches}
            authors={authors}
            emptyState={<NoBuildsSection />}
          />
        </HydrationBoundary>
      }
    />
  );
}
