import { cn } from "@ovr/ui/lib/utils";

import { getSkeletonGridItems } from "@/lib/components/skeleton-grid/getSkeletonGridItems";

/** Mirrors the column steps of `SnapshotGrid`. */
const SNAPSHOT_TIERS = [
  { columns: 2, className: "" },
  { columns: 3, className: "hidden md:block" },
  { columns: 4, className: "hidden lg:block" },
  { columns: 5, className: "hidden xl:block" },
];

export const BuildPageSkeleton = () => (
  <div className="flex animate-pulse flex-col gap-6">
    <div className="flex flex-col gap-3">
      <div className="h-7 w-72 rounded-sm bg-ovr-border-subtle" />
      <div className="h-4 w-96 max-w-full rounded-sm bg-ovr-border-subtle" />
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-md bg-ovr-border-subtle" />
        ))}
      </div>
      <div className="h-8 min-w-0 flex-1 rounded-md bg-ovr-border-subtle lg:w-64 lg:flex-none" />
    </div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {getSkeletonGridItems(SNAPSHOT_TIERS).map(({ key, className }) => (
        <div
          key={key}
          className={cn("h-40 rounded-card border border-ovr-border bg-ovr-elevated", className)}
        />
      ))}
    </div>
  </div>
);
