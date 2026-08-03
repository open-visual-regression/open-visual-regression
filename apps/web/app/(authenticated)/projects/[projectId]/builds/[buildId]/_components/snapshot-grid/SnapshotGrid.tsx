import { type BuildSnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { SnapshotCard, SnapshotCardSkeleton } from "./SnapshotCard";

type SnapshotGridLayoutProps = {
  className?: string;
  children: React.ReactNode;
};

const SnapshotGridLayout = ({ className, children }: SnapshotGridLayoutProps) => (
  <div
    className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", className)}
  >
    {children}
  </div>
);

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
    <SnapshotGridLayout>
      {snapshots.map((snapshot) => (
        <SnapshotCard
          key={snapshot.id}
          snapshot={snapshot}
          projectId={projectId}
          buildId={buildId}
        />
      ))}
    </SnapshotGridLayout>
  );
};

const SnapshotCardSkeletonRow = () => (
  <>
    <SnapshotCardSkeleton />
    <SnapshotCardSkeleton />
    <SnapshotCardSkeleton className="hidden md:block" />
    <SnapshotCardSkeleton className="hidden lg:block" />
    <SnapshotCardSkeleton className="hidden xl:block" />
  </>
);

export const SnapshotGridSkeleton = () => (
  <SnapshotGridLayout>
    <SnapshotCardSkeletonRow />
    <SnapshotCardSkeletonRow />
    <SnapshotCardSkeletonRow />
  </SnapshotGridLayout>
);
