import { type BuildSnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Typography } from "@ovr/ui/components/typography";

import { getSkeletonGridItems } from "@/lib/components/skeleton-grid/getSkeletonGridItems";

import { SnapshotCard, SnapshotCardSkeleton } from "./SnapshotCard";

const GRID_CLASS_NAME = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3";

const COLUMN_TIERS = [
  { columns: 2, className: "" },
  { columns: 3, className: "hidden md:block" },
  { columns: 4, className: "hidden lg:block" },
  { columns: 5, className: "hidden xl:block" },
];

type SnapshotGridProps = {
  snapshots: BuildSnapshotSchema[];
  projectId: string;
  buildId: string;
  search?: string;
};

export const SnapshotGrid = ({ snapshots, projectId, buildId, search }: SnapshotGridProps) => {
  if (snapshots.length === 0) {
    return (
      <Typography variant="caption" className="py-12 text-center">
        {search ? `no snapshots found matching "${search}"` : "no snapshots found"}
      </Typography>
    );
  }

  return (
    <div className={GRID_CLASS_NAME}>
      {snapshots.map((snapshot) => (
        <SnapshotCard
          key={snapshot.id}
          snapshot={snapshot}
          projectId={projectId}
          buildId={buildId}
        />
      ))}
    </div>
  );
};

export const SnapshotGridSkeleton = () => (
  <div className={GRID_CLASS_NAME}>
    {getSkeletonGridItems(COLUMN_TIERS).map(({ key, className }) => (
      <SnapshotCardSkeleton key={key} className={className} />
    ))}
  </div>
);
