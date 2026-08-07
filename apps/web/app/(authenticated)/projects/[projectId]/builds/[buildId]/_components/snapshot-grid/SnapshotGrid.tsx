"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";

import { type BuildSnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { useGridColumns } from "@/lib/hooks/useGridColumns";
import { useScrollContainer } from "@/lib/hooks/useScrollContainer";

import { SnapshotCard, SnapshotCardSkeleton } from "./SnapshotCard";

const ESTIMATED_ROW_HEIGHT = 244;
const OVERSCAN_ROWS = 2;

type SnapshotGridLayoutProps = {
  ref?: React.Ref<HTMLDivElement>;
  className?: string;
  children?: React.ReactNode;
};

const SnapshotGridLayout = ({ ref, className, children }: SnapshotGridLayoutProps) => (
  <div
    ref={ref}
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
  const listRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const grid = useGridColumns(probeRef);
  const scrollElement = useScrollContainer(listRef);

  const { ref: sentinelRef, inView } = useInView({
    rootMargin: "200px",
    skip: !hasNextPage,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore?.();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  const columns = grid?.columns ?? 1;
  const rowCount = grid ? Math.ceil(snapshots.length / columns) + (hasNextPage ? 1 : 0) : 0;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollElement,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    gap: grid?.gap ?? 0,
    overscan: OVERSCAN_ROWS,
  });

  const rows = virtualizer.getVirtualItems();

  if (snapshots.length === 0) {
    return (
      <Typography variant="caption" className="py-12 text-center">
        {search ? `no snapshots found matching "${search}"` : "no snapshots found"}
      </Typography>
    );
  }

  const renderRow = (rowIndex: number) => {
    const isLoaderRow = rowIndex * columns >= snapshots.length;

    if (isLoaderRow) {
      return <SnapshotCardSkeletonRow ref={sentinelRef} />;
    }

    return snapshots
      .slice(rowIndex * columns, rowIndex * columns + columns)
      .map((snapshot) => (
        <SnapshotCard
          key={snapshot.id}
          snapshot={snapshot}
          projectId={projectId}
          buildId={buildId}
        />
      ));
  };

  return (
    <div ref={listRef}>
      <SnapshotGridLayout ref={probeRef} aria-hidden className="h-0" />
      {grid ? (
        <div style={{ height: virtualizer.getTotalSize(), width: "100%", position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: grid.gap,
              transform: `translateY(${
                (rows[0]?.start ?? 0) - virtualizer.options.scrollMargin
              }px)`,
            }}
          >
            {rows.map((row) => (
              <div key={row.key} data-index={row.index} ref={virtualizer.measureElement}>
                <SnapshotGridLayout>{renderRow(row.index)}</SnapshotGridLayout>
              </div>
            ))}
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export const SnapshotGridSkeleton = () => (
  <SnapshotGridLayout>
    <SnapshotCardSkeletonRow />
    <SnapshotCardSkeletonRow />
    <SnapshotCardSkeletonRow />
  </SnapshotGridLayout>
);
