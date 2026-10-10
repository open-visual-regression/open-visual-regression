import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connection } from "next/server";
import { Suspense } from "react";

import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";
import { APP_VERSION } from "@/lib/utils/version";

import { SIDEBAR_PROJECTS_QUERY, SIDEBAR_RECENT_BUILDS_QUERY } from "./constants";
import { ProjectsSidebarContainer } from "./ProjectsSidebarContainer";
import { ProjectsSidebarSkeleton } from "./ProjectsSidebarSkeleton";

const ProjectsSidebarPrefetch = async () => {
  await connection();

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(orpcServer.projects.list.queryOptions(SIDEBAR_PROJECTS_QUERY));
  void queryClient.prefetchQuery(orpcServer.projects.count.queryOptions());
  void queryClient.prefetchQuery(orpcServer.builds.list.queryOptions(SIDEBAR_RECENT_BUILDS_QUERY));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectsSidebarContainer version={APP_VERSION} />
    </HydrationBoundary>
  );
};

export default function ProjectsSidebarSlot() {
  return (
    <Suspense fallback={<ProjectsSidebarSkeleton />}>
      <ProjectsSidebarPrefetch />
    </Suspense>
  );
}
