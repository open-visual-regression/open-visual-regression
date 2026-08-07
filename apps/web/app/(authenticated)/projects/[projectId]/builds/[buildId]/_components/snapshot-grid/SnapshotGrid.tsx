"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { type BuildSnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { SnapshotCard, SnapshotCardSkeleton } from "./SnapshotCard";

type SnapshotGridLayoutProps = {
  className?: string;
  children: React.ReactNode;
};

const SnapshotGridLayout = ({ className, children }: SnapshotGridLayoutProps) => (
  <div
    className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", className)}
  >
    {children}
  </div>
);

type SnapshotCardSkeletonRowProps = {
  ref?: React.Ref<HTMLDivElement>;
};

const SnapshotCardSkeletonRow = ({ ref }: SnapshotCardSkeletonRowProps) => (
  <>
    <SnapshotCardSkeleton ref={ref} />
    <SnapshotCardSkeleton />
    <SnapshotCardSkeleton className="hidden md:block" />
    <SnapshotCardSkeleton className="hidden lg:block" />
    <SnapshotCardSkeleton className="hidden xl:block" />
  </>
);

type SnapshotGridProps = {
  snapshots: BuildSnapshotSchema[];
  projectId: string;
  buildId: string;
  search?: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
};

export const SnapshotGrid = ({
  snapshots,
  projectId,
  buildId,
  search,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
}: SnapshotGridProps) => {
  const { ref: sentinelRef, inView } = useInView({
    rootMargin: "200px",
    skip: !hasNextPage,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore?.();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  if (snapshots.length === 0) {
    return (
      <Typography variant="caption" className="py-12 text-center">
        {search ? `no snapshots found matching "${search}"` : "no snapshots found"}
      </Typography>
    );
  }

  return (
    <SnapshotGridLayout>
      {snapshots.map((snapshot) => (
        <SnapshotCard
          key={snapshot.id}
          snapshot={snapshot}
          projectId={projectId}
          buildId={buildId}
        />
      ))}
      {hasNextPage ? <SnapshotCardSkeletonRow ref={sentinelRef} /> : null}
    </SnapshotGridLayout>
  );
};

export const SnapshotGridSkeleton = () => (
  <SnapshotGridLayout>
    <SnapshotCardSkeletonRow />
    <SnapshotCardSkeletonRow />
    <SnapshotCardSkeletonRow />
  </SnapshotGridLayout>
);
