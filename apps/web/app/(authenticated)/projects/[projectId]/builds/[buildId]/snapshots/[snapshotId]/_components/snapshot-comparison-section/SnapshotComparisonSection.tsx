import type { DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { ComparisonView } from "./comparison-view/ComparisonView";
import { getStoragePath } from "@/lib/utils/storage";
import { SnapshotPaneImage } from "../snapshot-pane/SnapshotPaneImage";

export type SnapshotComparisonSectionProps = {
  snapshot: SnapshotSchema;
  diff: DiffSchema | null;
};

export const SnapshotComparisonSection = ({ snapshot, diff }: SnapshotComparisonSectionProps) => {
  const alt = `snapshot of ${snapshot.targetTitle} ${snapshot.targetName}`;

  if (!diff?.baselineSnapshot) {
    return <SnapshotPaneImage imagePath={getStoragePath(snapshot.imagePath)} alt={alt} />;
  }

  return (
    <ComparisonView
      baselineImagePath={getStoragePath(diff.baselineSnapshot.imagePath)}
      baselineAlt={`baseline ${alt}`}
      newImagePath={getStoragePath(snapshot.imagePath)}
      newAlt={alt}
      diffImagePath={getStoragePath(diff.diffImagePath)}
    />
  );
};
