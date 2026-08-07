"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";

import { type BuildSnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { useScrollContainer } from "@/lib/providers/ScrollContainer";
import { chunk } from "@/lib/utils/array";

import { SnapshotCard, SnapshotCardSkeleton } from "./SnapshotCard";

const CHUNK_SIZE = 12;
const ESTIMATED_CHUNK_HEIGHT = 768;
const OVERSCAN_CHUNKS = 1;

type SnapshotGridLayoutProps = {
  className?: string;
  children?: React.ReactNode;
};

const SnapshotGridLayout = ({ className, children }: SnapshotGridLayoutProps) => (
  <div
    className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6", className)}
  >
    {children}
  </div>
);

const SnapshotCardSkeletons = ({ count }: { count: number }) =>
  Array.from({ length: count }, (_, index) => <SnapshotCardSkeleton key={index} />);

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
  const scrollElement = useScrollContainer();
  const [chunkHeight, setChunkHeight] = useState(ESTIMATED_CHUNK_HEIGHT);

  const chunks = chunk(snapshots, CHUNK_SIZE);

  const virtualizer = useVirtualizer({
    count: scrollElement ? chunks.length + (hasNextPage ? 1 : 0) : 0,
    getScrollElement: () => scrollElement,
    estimateSize: () => chunkHeight,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    overscan: OVERSCAN_CHUNKS,
  });

  const measureChunk = (node: HTMLDivElement | null) => {
    virtualizer.measureElement(node);

    if (!node || Number(node.dataset.index) >= chunks.length - 1) {
      return;
    }

    const height = node.offsetHeight;
    if (height > 0) {
      setChunkHeight((current) => (current === height ? current : height));
    }
  };

  const items = virtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = items.at(-1);

    if (lastItem && lastItem.index >= chunks.length - 1 && hasNextPage && !isFetchingNextPage) {
      onLoadMore?.();
    }
  }, [items, chunks.length, hasNextPage, isFetchingNextPage, onLoadMore]);

  if (snapshots.length === 0) {
    return (
      <Typography variant="caption" className="py-12 text-center">
        {search ? `no snapshots found matching "${search}"` : "no snapshots found"}
      </Typography>
    );
  }

  const renderChunk = (index: number) => {
    const snapshotChunk = chunks[index];

    if (!snapshotChunk) {
      return <SnapshotCardSkeletons count={CHUNK_SIZE} />;
    }

    return snapshotChunk.map((snapshot) => (
      <SnapshotCard key={snapshot.id} snapshot={snapshot} projectId={projectId} buildId={buildId} />
    ));
  };

  return (
    <div ref={listRef}>
      {scrollElement ? (
        <div style={{ height: virtualizer.getTotalSize(), width: "100%", position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${
                (items[0]?.start ?? 0) - virtualizer.options.scrollMargin
              }px)`,
            }}
          >
            {items.map((item) => (
              <div key={item.key} data-index={item.index} ref={measureChunk}>
                <SnapshotGridLayout className="pb-3">{renderChunk(item.index)}</SnapshotGridLayout>
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
          {hasNextPage ? <SnapshotCardSkeletons count={CHUNK_SIZE} /> : null}
        </SnapshotGridLayout>
      )}
    </div>
  );
};

export const SnapshotGridSkeleton = () => (
  <SnapshotGridLayout>
    <SnapshotCardSkeletons count={CHUNK_SIZE * 2} />
  </SnapshotGridLayout>
);
