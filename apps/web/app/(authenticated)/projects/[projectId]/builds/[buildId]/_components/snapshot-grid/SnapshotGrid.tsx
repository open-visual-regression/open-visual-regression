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
  <ul
    className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", className)}
  >
    {children}
  </ul>
);

type SnapshotCardSkeletonItemProps = {
  ref?: React.Ref<HTMLLIElement>;
  className?: string;
};

const SnapshotCardSkeletonItem = ({ ref, className }: SnapshotCardSkeletonItemProps) => (
  <li ref={ref} aria-hidden className={className}>
    <SnapshotCardSkeleton />
  </li>
);

// The responsive `hidden` classes make this exactly one full row at every
// breakpoint: two cards at base, then three, four and five.
const SnapshotCardSkeletonRow = ({ ref }: { ref?: React.Ref<HTMLLIElement> }) => (
  <>
    <SnapshotCardSkeletonItem ref={ref} />
    <SnapshotCardSkeletonItem />
    <SnapshotCardSkeletonItem className="hidden md:block" />
    <SnapshotCardSkeletonItem className="hidden lg:block" />
    <SnapshotCardSkeletonItem className="hidden xl:block" />
  </>
);

type SnapshotGridProps = {
  snapshots: BuildSnapshotSchema[];
  projectId: string;
  buildId: string;
  search?: string;
  /** Snapshots matching the current filters, not the number loaded so far. */
  total?: number;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
};

export const SnapshotGrid = ({
  snapshots,
  projectId,
  buildId,
  search,
  total,
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
    <>
      {/* Pages arrive as the reader scrolls, which is otherwise silent to a
          screen reader — and leaves no way to tell how much list is left. */}
      <Typography role="status" aria-label="snapshot count" variant="caption" className="sr-only">
        {total === undefined
          ? `showing ${snapshots.length} snapshots`
          : `showing ${snapshots.length} of ${total} snapshots`}
      </Typography>
      <SnapshotGridLayout>
        {snapshots.map((snapshot) => (
          <li key={snapshot.id}>
            <SnapshotCard snapshot={snapshot} projectId={projectId} buildId={buildId} />
          </li>
        ))}
        {/* Rendered whenever another page exists, not only while fetching: the
            sentinel has to be in the DOM for the observer to see it. */}
        {hasNextPage ? <SnapshotCardSkeletonRow ref={sentinelRef} /> : null}
      </SnapshotGridLayout>
    </>
  );
};

export const SnapshotGridSkeleton = () => (
  <SnapshotGridLayout>
    <SnapshotCardSkeletonRow />
    <SnapshotCardSkeletonRow />
    <SnapshotCardSkeletonRow />
  </SnapshotGridLayout>
);
