"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc/client";
import { projectsListInfiniteOptions } from "@/lib/orpc/projects-query";

import { NoProjectsSection } from "./NoProjectsSection";
import { ProjectCardsList } from "./ProjectCardsList";

type ProjectsSectionProps = {
  role: string | null | undefined;
};

export const ProjectsSection = ({ role }: ProjectsSectionProps) => {
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(
    orpc.projects.list.infiniteOptions(projectsListInfiniteOptions()),
  );

  const projects = data?.pages.flatMap((page) => page.projects) ?? [];

  if (!isPending && projects.length === 0) {
    return <NoProjectsSection role={role} />;
  }

  return (
    <ProjectCardsList
      projects={projects}
      isLoading={isPending}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  );
};
