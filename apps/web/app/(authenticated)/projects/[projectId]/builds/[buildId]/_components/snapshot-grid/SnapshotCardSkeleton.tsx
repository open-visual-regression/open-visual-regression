import { Skeleton } from "@ovr/ui/components/skeleton";

export const SnapshotCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-card border border-ovr-border bg-ovr-elevated">
    <Skeleton className="h-40 w-full rounded-none border-b border-ovr-border-subtle" />
    <div className="flex min-w-0 flex-col gap-1 px-3 py-2.5">
      <Skeleton className="h-3.5 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  </div>
);
