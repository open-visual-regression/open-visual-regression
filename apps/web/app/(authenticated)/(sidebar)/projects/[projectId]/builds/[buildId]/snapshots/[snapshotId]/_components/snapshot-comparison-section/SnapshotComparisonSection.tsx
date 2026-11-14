import type { BaselineSnapshotSchema, DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";

import { getStoragePath } from "@/lib/utils/storage";

import { SnapshotZoomDialog } from "../snapshot-zoom/SnapshotZoomDialog";
import { ComparisonView } from "./comparison-view/ComparisonView";
import { NewSnapshotPane } from "./comparison-view/NewSnapshotPane";

export type SnapshotComparisonSectionProps = {
  snapshot: SnapshotSchema;
  diff: DiffSchema | null;
  baseline: BaselineSnapshotSchema | null;
};

export const SnapshotComparisonSection = ({
  snapshot,
  diff,
  baseline,
}: SnapshotComparisonSectionProps) => {
  const alt = `Snapshot of ${snapshot.targetTitle} ${snapshot.targetName}`;
  const newSnapshot = { imagePath: getStoragePath(snapshot.imagePath), alt };

  if (!baseline) {
    return (
      <SnapshotZoomDialog baseline={null} newSnapshot={newSnapshot} diffImagePath={null}>
        <NewSnapshotPane {...newSnapshot} />
      </SnapshotZoomDialog>
    );
  }

  return (
    <ComparisonView
      baseline={{
        imagePath: getStoragePath(baseline.imagePath),
        alt: `Baseline ${alt.charAt(0).toLowerCase()}${alt.slice(1)}`,
        commitSha: baseline.commitSha,
        commitUrl: baseline.commitUrl,
      }}
      newSnapshot={newSnapshot}
      diffImagePath={getStoragePath(diff?.diffImagePath ?? null)}
    />
  );
};
