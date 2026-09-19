"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

import { type BuildSchema } from "@ovr/api/contracts/builds";
import { Typography } from "@ovr/ui/components/typography";

import { BuildRow } from "./BuildRow";
import { BuildRowSkeleton } from "./BuildRowSkeleton";

const INITIAL_SKELETON_ROW_COUNT = 40;

type BuildsListProps = {
  data: BuildSchema[];
  search?: string;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

export const BuildsList = ({
  data,
  search,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: BuildsListProps) => {
  const [scrollElement, setScrollElement] = useState<HTMLUListElement | null>(null);
  const { ref: sentinelRef, inView } = useInView({
    root: scrollElement,
    rootMargin: "200px",
    skip: !hasNextPage,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  return (
    <ul
      ref={setScrollElement}
      data-scroll-restoration-id="builds-list"
      className="min-h-0 flex-1 divide-y divide-ovr-border-subtle overflow-x-hidden overflow-y-auto rounded-card border border-ovr-border bg-ovr-elevated"
    >
      {isLoading ? (
        Array.from({ length: INITIAL_SKELETON_ROW_COUNT }, (_, index) => (
          <BuildRowSkeleton key={index} />
        ))
      ) : data.length === 0 ? (
        <li className="flex h-20 items-center justify-center px-3 text-center">
          <Typography variant="body-sm" className="text-ovr-fg-secondary">
            {search ? `no builds found matching "${search}"` : "no builds found"}
          </Typography>
        </li>
      ) : (
        data.map((build) => <BuildRow key={build.id} build={build} />)
      )}
      {!isLoading && hasNextPage ? <BuildRowSkeleton ref={sentinelRef} /> : null}
    </ul>
  );
};

const noop = () => {};

export const BuildsListSkeleton = () => (
  <BuildsList
    data={[]}
    isLoading
    hasNextPage={false}
    isFetchingNextPage={false}
    onLoadMore={noop}
  />
);
