"use client";

import { useSuspenseQueries } from "@tanstack/react-query";
import { Suspense } from "react";

import { orpc } from "@/lib/orpc/client";

import { SIDEBAR_PROJECTS_QUERY, SIDEBAR_RECENT_BUILDS_QUERY } from "./constants";
import { ProjectsSidebar } from "./ProjectsSidebar";
import { ProjectsSidebarSkeleton } from "./ProjectsSidebarSkeleton";

type ProjectsSidebarContainerProps = {
  version?: string;
};

const ProjectsSidebarData = ({ version }: ProjectsSidebarContainerProps) => {
  const [projectsQuery, countQuery, buildsQuery] = useSuspenseQueries({
    queries: [
      orpc.projects.list.queryOptions(SIDEBAR_PROJECTS_QUERY),
      orpc.projects.count.queryOptions(),
      orpc.builds.list.queryOptions(SIDEBAR_RECENT_BUILDS_QUERY),
    ],
  });

  return (
    <ProjectsSidebar
      projects={projectsQuery.data.projects}
      total={countQuery.data.total}
      builds={buildsQuery.data.builds}
      version={version}
    />
  );
};

// The sidebar owns its loading state, so no route-level loading.tsx fallback ever renders here.
const ProjectsSidebarContainer = ({ version }: ProjectsSidebarContainerProps) => (
  <Suspense fallback={<ProjectsSidebarSkeleton />}>
    <ProjectsSidebarData version={version} />
  </Suspense>
);

export { ProjectsSidebarContainer };
