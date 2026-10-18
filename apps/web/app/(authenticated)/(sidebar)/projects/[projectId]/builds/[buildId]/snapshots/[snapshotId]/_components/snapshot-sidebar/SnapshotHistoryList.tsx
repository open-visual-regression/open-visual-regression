"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";

import { type SnapshotHistoryEntrySchema } from "@ovr/api/contracts/snapshots";
import { Typography } from "@ovr/ui/components/typography";

import { useScrollContainer } from "@/lib/providers/ScrollContainer";

import { SnapshotHistoryCard, SnapshotHistoryCardSkeleton } from "./SnapshotHistoryCard";

const ESTIMATED_CARD_HEIGHT = 236;
const OVERSCAN_CARDS = 3;
const SKELETON_COUNT = 3;

type SnapshotHistoryListProps = {
  entries: SnapshotHistoryEntrySchema[];
  branch: string;
  projectId: string;
  snapshotId: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
};

export const SnapshotHistoryList = ({
  entries,
  branch,
  projectId,
  snapshotId,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
}: SnapshotHistoryListProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollElement = useScrollContainer();

  const virtualizer = useVirtualizer({
    count: scrollElement ? entries.length + (hasNextPage ? 1 : 0) : 0,
    getScrollElement: () => scrollElement,
    estimateSize: () => ESTIMATED_CARD_HEIGHT,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    overscan: OVERSCAN_CARDS,
  });

  const items = virtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = items.at(-1);

    if (lastItem && lastItem.index >= entries.length - 1 && hasNextPage && !isFetchingNextPage) {
      onLoadMore?.();
    }
  }, [items, entries.length, hasNextPage, isFetchingNextPage, onLoadMore]);

  if (entries.length === 0) {
    return (
      <Typography variant="caption" className="py-12 text-center">
        no snapshots on {branch} yet
      </Typography>
    );
  }

  const renderEntry = (entry: SnapshotHistoryEntrySchema) => (
    <SnapshotHistoryCard
      key={entry.id}
      entry={entry}
      projectId={projectId}
      current={entry.id === snapshotId}
    />
  );

  return (
    <div ref={listRef}>
      {scrollElement ? (
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          <div
            className="absolute inset-x-0 top-0"
            style={{
              transform: `translateY(${
                (items[0]?.start ?? 0) - virtualizer.options.scrollMargin
              }px)`,
            }}
          >
            {items.map((item) => {
              const entry = entries[item.index];

              return (
                <div
                  key={item.key}
                  data-index={item.index}
                  ref={virtualizer.measureElement}
                  className="pb-3"
                >
                  {entry ? renderEntry(entry) : <SnapshotHistoryCardSkeleton />}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map(renderEntry)}
          {hasNextPage ? <SnapshotHistoryCardSkeleton /> : null}
        </div>
      )}
    </div>
  );
};

export const SnapshotHistoryListSkeleton = () => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: SKELETON_COUNT }, (_, index) => (
      <SnapshotHistoryCardSkeleton key={index} />
    ))}
  </div>
);
