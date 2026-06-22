import { type BuildSnapshotSchema } from "@ovr/api/contracts/builds";
import { SnapshotCard } from "./SnapshotCard";

type SnapshotGridProps = {
  snapshots: BuildSnapshotSchema[];
  projectId: string;
  buildId: string;
};

export const SnapshotGrid = ({ snapshots, projectId, buildId }: SnapshotGridProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {snapshots.map((snapshot) => (
          <SnapshotCard
            key={snapshot.id}
            snapshot={snapshot}
            projectId={projectId}
            buildId={buildId}
          />
        ))}
      </div>
    </div>
  );
};
