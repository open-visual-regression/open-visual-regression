"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { ProjectDto } from "@ovr/api/contracts/projects";

import { ProjectCardListItem } from "./ProjectCardListItem";
import { ProjectCardSkeleton } from "./ProjectCardSkeleton";

// Keeps the grid free of a partial trailing row while loading, regardless of the
// active 1/2/3-column breakpoint (12 divides evenly by 1, 2, and 3).
const SKELETON_CARD_COUNT = 12;

type ProjectCardsListProps = {
  projects: ProjectDto[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

export const ProjectCardsList = ({
  projects,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: ProjectCardsListProps) => {
  const { ref: sentinelRef, inView } = useInView({
    rootMargin: "200px",
    skip: !hasNextPage,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {isLoading
        ? Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
            <ProjectCardSkeleton key={index} />
          ))
        : projects.map((project) => <ProjectCardListItem key={project.id} project={project} />)}
      {!isLoading && hasNextPage
        ? Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
            <ProjectCardSkeleton key={index} ref={index === 0 ? sentinelRef : undefined} />
          ))
        : null}
    </ul>
  );
};
