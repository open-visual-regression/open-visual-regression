"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { ProjectDto } from "@ovr/api/contracts/projects";
import { cn } from "@ovr/ui/lib/utils";

import { ProjectCardListItem } from "./ProjectCardListItem";
import { ProjectCardSkeleton } from "./ProjectCardSkeleton";

type ProjectCardSkeletonRowProps = {
  ref?: React.Ref<HTMLLIElement>;
};

const ProjectCardSkeletonRow = ({ ref }: ProjectCardSkeletonRowProps) => (
  <>
    <ProjectCardSkeleton ref={ref} />
    <ProjectCardSkeleton className="hidden md:block" />
    <ProjectCardSkeleton className="hidden lg:block" />
  </>
);

const ProjectCardSkeletonRows = ({ ref }: ProjectCardSkeletonRowProps) => (
  <>
    <ProjectCardSkeletonRow ref={ref} />
    <ProjectCardSkeletonRow />
    <ProjectCardSkeletonRow />
  </>
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
      {isLoading ? (
        <ProjectCardSkeletonRows />
      ) : (
        projects.map((project) => <ProjectCardListItem key={project.id} project={project} />)
      )}
      {!isLoading && hasNextPage ? <ProjectCardSkeletonRows ref={sentinelRef} /> : null}
    </ProjectCardsLayout>
  );
};

export const ProjectCardsListSkeleton = () => (
  <ProjectCardsLayout>
    <ProjectCardSkeletonRows />
  </ProjectCardsLayout>
);
