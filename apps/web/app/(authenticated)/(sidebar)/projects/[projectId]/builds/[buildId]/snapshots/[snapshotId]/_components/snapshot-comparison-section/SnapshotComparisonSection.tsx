import type { DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";

import { getStoragePath } from "@/lib/utils/storage";

import { SnapshotZoomDialog } from "../snapshot-zoom/SnapshotZoomDialog";
import { ComparisonView } from "./comparison-view/ComparisonView";
import { NewSnapshotPane } from "./comparison-view/NewSnapshotPane";

export type SnapshotComparisonSectionProps = {
  snapshot: SnapshotSchema;
  diff: DiffSchema | null;
};

export const SnapshotComparisonSection = ({ snapshot, diff }: SnapshotComparisonSectionProps) => {
  const alt = `snapshot of ${snapshot.targetTitle} ${snapshot.targetName}`;
  const newSnapshot = { imagePath: getStoragePath(snapshot.imagePath), alt };

  if (!diff?.baselineSnapshot) {
    return (
      <SnapshotZoomDialog baseline={null} newSnapshot={newSnapshot} diffImagePath={null}>
        <NewSnapshotPane {...newSnapshot} />
      </SnapshotZoomDialog>
    );
  }

  return (
    <ComparisonView
      baseline={{
        imagePath: getStoragePath(diff.baselineSnapshot.imagePath),
        alt: `baseline ${alt}`,
        commitSha: diff.baselineSnapshot.commitSha,
        commitUrl: diff.baselineSnapshot.commitUrl,
      }}
      newSnapshot={newSnapshot}
      diffImagePath={getStoragePath(diff.diffImagePath)}
    />
  );
};
