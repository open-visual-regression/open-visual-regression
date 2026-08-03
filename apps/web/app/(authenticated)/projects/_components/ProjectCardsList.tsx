"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { ProjectDto } from "@ovr/api/contracts/projects";

import { getSkeletonGridItems } from "@/lib/components/skeleton-grid/getSkeletonGridItems";

import { ProjectCardListItem } from "./ProjectCardListItem";
import { ProjectCardSkeleton } from "./ProjectCardSkeleton";

const SKELETON_CARD_COUNT = 12;

const GRID_CLASS_NAME = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

const COLUMN_TIERS = [
  { columns: 1, className: "" },
  { columns: 2, className: "hidden md:block" },
  { columns: 3, className: "hidden lg:block" },
];

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
    <ul className={GRID_CLASS_NAME}>
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

export const ProjectCardsListSkeleton = () => (
  <ul className={GRID_CLASS_NAME}>
    {getSkeletonGridItems(COLUMN_TIERS).map(({ key, className }) => (
      <ProjectCardSkeleton key={key} className={className} />
    ))}
  </ul>
);
