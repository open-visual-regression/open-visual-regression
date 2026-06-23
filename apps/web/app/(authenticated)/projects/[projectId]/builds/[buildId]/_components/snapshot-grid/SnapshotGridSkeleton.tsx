import { SnapshotCardSkeleton } from "./SnapshotCardSkeleton";

type SnapshotGridSkeletonProps = {
  count?: number;
};

export const SnapshotGridSkeleton = ({ count = 12 }: SnapshotGridSkeletonProps) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <SnapshotCardSkeleton key={i} />
    ))}
  </div>
);
