"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { ProjectDto } from "@ovr/api/contracts/projects";
import { cn } from "@ovr/ui/lib/utils";

import { ProjectCardListItem } from "./ProjectCardListItem";
import { ProjectCardSkeleton } from "./ProjectCardSkeleton";

const SKELETON_CARD_COUNT = 12;

type ProjectCardsLayoutProps = {
  className?: string;
  children: React.ReactNode;
};

const ProjectCardsLayout = ({ className, children }: ProjectCardsLayoutProps) => (
  <ul className={cn("grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3", className)}>
    {children}
  </ul>
);

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
    <ProjectCardsLayout>
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
    </ProjectCardsLayout>
  );
};

const skeletonCards = (count: number, className?: string) =>
  Array.from({ length: count }, (_, index) => (
    <ProjectCardSkeleton key={`${className ?? "base"}-${index}`} className={className} />
  ));

export const ProjectCardsListSkeleton = () => (
  <ProjectCardsLayout>
    {skeletonCards(3)}
    {skeletonCards(3, "hidden md:block")}
    {skeletonCards(3, "hidden lg:block")}
  </ProjectCardsLayout>
);
