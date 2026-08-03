"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { ProjectDto } from "@ovr/api/contracts/projects";
import { cn } from "@ovr/ui/lib/utils";

import { ProjectCardListItem } from "./ProjectCardListItem";
import { ProjectCardSkeleton } from "./ProjectCardSkeleton";

const skeletonCards = (sentinelRef?: React.Ref<HTMLLIElement>) =>
  [undefined, "hidden md:block", "hidden lg:block"].flatMap((className, tier) =>
    Array.from({ length: 3 }, (_, index) => (
      <ProjectCardSkeleton
        key={`${tier}-${index}`}
        className={className}
        ref={tier === 0 && index === 0 ? sentinelRef : undefined}
      />
    )),
  );

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
        ? skeletonCards()
        : projects.map((project) => <ProjectCardListItem key={project.id} project={project} />)}
      {!isLoading && hasNextPage ? skeletonCards(sentinelRef) : null}
    </ProjectCardsLayout>
  );
};

export const ProjectCardsListSkeleton = () => (
  <ProjectCardsLayout>{skeletonCards()}</ProjectCardsLayout>
);
