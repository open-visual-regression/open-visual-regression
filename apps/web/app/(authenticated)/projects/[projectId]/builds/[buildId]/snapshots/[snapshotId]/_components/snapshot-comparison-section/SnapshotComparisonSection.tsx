import type { DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";

import { getStoragePath } from "@/lib/utils/storage";

import { SnapshotFitProvider } from "../snapshot-pane/snapshot-fit";
import { ComparisonView } from "./comparison-view/ComparisonView";
import { NewSnapshotPane } from "./comparison-view/NewSnapshotPane";

export type SnapshotComparisonSectionProps = {
  snapshot: SnapshotSchema;
  diff: DiffSchema | null;
};

export const SnapshotComparisonSection = ({ snapshot, diff }: SnapshotComparisonSectionProps) => {
  const alt = `snapshot of ${snapshot.targetTitle} ${snapshot.targetName}`;

  const comparison = !diff?.baselineSnapshot ? (
    <NewSnapshotPane imagePath={getStoragePath(snapshot.imagePath)} alt={alt} />
  ) : (
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

  return <SnapshotFitProvider>{comparison}</SnapshotFitProvider>;
};
