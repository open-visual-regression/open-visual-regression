import type { DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";

import { getStoragePath } from "@/lib/utils/storage";

import { ComparisonView } from "./comparison-view/ComparisonView";
import { NewSnapshotPane } from "./comparison-view/NewSnapshotPane";

export type SnapshotComparisonSectionProps = {
  snapshot: SnapshotSchema;
  diff: DiffSchema | null;
};

export const SnapshotComparisonSection = ({ snapshot, diff }: SnapshotComparisonSectionProps) => {
  const alt = `snapshot of ${snapshot.targetTitle} ${snapshot.targetName}`;

  if (!diff?.baselineSnapshot) {
    return <NewSnapshotPane imagePath={getStoragePath(snapshot.imagePath)} alt={alt} />;
  }

  return (
    <ComparisonView
      baseline={{
        imagePath: getStoragePath(diff.baselineSnapshot.imagePath),
        alt: `baseline ${alt}`,
        commitSha: diff.baselineSnapshot.commitSha,
        commitUrl: diff.baselineSnapshot.commitUrl,
      }}
      newSnapshot={{ imagePath: getStoragePath(snapshot.imagePath), alt }}
      diffImagePath={getStoragePath(diff.diffImagePath)}
    />
  );
};
