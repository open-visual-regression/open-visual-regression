import { type BuildSnapshotSchema } from "@ovr/api/contracts/snapshots";
import { SnapshotCard } from "./SnapshotCard";

type SnapshotGridProps = {
  snapshots: BuildSnapshotSchema[];
  projectId: string;
  buildId: string;
};

export const SnapshotGrid = ({ snapshots, projectId, buildId }: SnapshotGridProps) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {snapshots.map((snapshot) => (
      <SnapshotCard key={snapshot.id} snapshot={snapshot} projectId={projectId} buildId={buildId} />
    ))}
  </div>
);
