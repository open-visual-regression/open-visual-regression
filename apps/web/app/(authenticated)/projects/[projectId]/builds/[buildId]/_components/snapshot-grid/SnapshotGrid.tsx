"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";

import { type BuildSnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { useGridMetrics } from "@/lib/hooks/useGridMetrics";

import { SnapshotCard, SnapshotCardSkeleton } from "./SnapshotCard";

const OVERSCAN_ROWS = 2;

type SnapshotGridLayoutProps = {
  ref?: React.Ref<HTMLDivElement>;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

const SnapshotGridLayout = ({ ref, className, style, children }: SnapshotGridLayoutProps) => (
  <div
    ref={ref}
    style={style}
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
  const gridRef = useRef<HTMLDivElement>(null);
  const metrics = useGridMetrics(gridRef);

  const { ref: sentinelRef, inView } = useInView({
    rootMargin: "200px",
    skip: !hasNextPage,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore?.();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  const columns = metrics?.columns ?? 1;
  const rowCount = metrics ? Math.ceil(snapshots.length / columns) + (hasNextPage ? 1 : 0) : 0;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => metrics?.scrollElement ?? null,
    estimateSize: () => metrics?.rowHeight ?? 0,
    scrollMargin: metrics?.scrollMargin ?? 0,
    overscan: OVERSCAN_ROWS,
    useFlushSync: false,
  });

  if (snapshots.length === 0) {
    return (
      <Typography variant="caption" className="py-12 text-center">
        {search ? `no snapshots found matching "${search}"` : "no snapshots found"}
      </Typography>
    );
  }

  if (!metrics) {
    return (
      <SnapshotGridLayout ref={gridRef}>
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
  }

  const rows = virtualizer.getVirtualItems();
  const firstRow = rows[0]?.index ?? 0;
  const lastRow = rows.at(-1)?.index ?? -1;
  const visible = snapshots.slice(firstRow * columns, (lastRow + 1) * columns);

  return (
    <SnapshotGridLayout
      ref={gridRef}
      style={{
        paddingTop: firstRow * metrics.rowHeight,
        paddingBottom: Math.max(0, rowCount - 1 - lastRow) * metrics.rowHeight,
      }}
    >
      {visible.map((snapshot) => (
        <SnapshotCard
          key={snapshot.id}
          snapshot={snapshot}
          projectId={projectId}
          buildId={buildId}
        />
      ))}
      {hasNextPage && lastRow === rowCount - 1 ? (
        <SnapshotCardSkeletonRow ref={sentinelRef} />
      ) : null}
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
