"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Fragment, useEffect, useRef, useState } from "react";

import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { useScrollContainer } from "@/lib/providers/ScrollContainer";
import { chunk } from "@/lib/utils/chunk";

import { SnapshotCardSkeleton } from "./SnapshotCardLayout";

const CHUNK_SIZE = 12;
const ESTIMATED_CHUNK_HEIGHT = 768;
const OVERSCAN_CHUNKS = 1;
const PAGE_SKELETON_COUNT = 60;

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

type SnapshotGridProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  emptyMessage: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
};

export const SnapshotGrid = <T,>({
  items,
  getKey,
  renderItem,
  emptyMessage,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
}: SnapshotGridProps<T>) => {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollElement = useScrollContainer();
  const [chunkHeight, setChunkHeight] = useState(ESTIMATED_CHUNK_HEIGHT);

  const chunks = chunk(items, CHUNK_SIZE);

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

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems.at(-1);

    if (lastItem && lastItem.index >= chunks.length - 1 && hasNextPage && !isFetchingNextPage) {
      onLoadMore?.();
    }
  }, [virtualItems, chunks.length, hasNextPage, isFetchingNextPage, onLoadMore]);

  if (items.length === 0) {
    return (
      <Typography variant="caption" className="py-12 text-center">
        {emptyMessage}
      </Typography>
    );
  }

  const renderItems = (itemsToRender: T[]) =>
    itemsToRender.map((item) => <Fragment key={getKey(item)}>{renderItem(item)}</Fragment>);

  const renderChunk = (index: number) => {
    const itemChunk = chunks[index];

    if (!itemChunk) {
      return <SnapshotCardSkeletons count={CHUNK_SIZE} />;
    }

    return renderItems(itemChunk);
  };

  return (
    <div ref={listRef}>
      {scrollElement ? (
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          <div
            className="absolute inset-x-0 top-0"
            style={{
              transform: `translateY(${
                (virtualItems[0]?.start ?? 0) - virtualizer.options.scrollMargin
              }px)`,
            }}
          >
            {virtualItems.map((virtualItem) => (
              <div key={virtualItem.key} data-index={virtualItem.index} ref={measureChunk}>
                <SnapshotGridLayout className="pb-3">
                  {renderChunk(virtualItem.index)}
                </SnapshotGridLayout>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <SnapshotGridLayout>
          {renderItems(items)}
          {hasNextPage ? <SnapshotCardSkeletons count={CHUNK_SIZE} /> : null}
        </SnapshotGridLayout>
      )}
    </div>
  );
};

export const SnapshotGridSkeleton = () => (
  <SnapshotGridLayout>
    <SnapshotCardSkeletons count={PAGE_SKELETON_COUNT} />
  </SnapshotGridLayout>
);
