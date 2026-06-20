import type { DiffSchema } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { SingleSnapshot } from "./SingleSnapshot";
import { ComparisonView } from "./comparison-view/ComparisonView";

export type SnapshotComparisonProps = {
  snapshot: SnapshotSchema;
  diff: DiffSchema | null;
};

export const SnapshotComparison = ({ snapshot, diff }: SnapshotComparisonProps) => {
  const alt = `snapshot of ${snapshot.targetTitle} ${snapshot.targetName}`;

  if (!diff?.baselineSnapshot) {
    return <SingleSnapshot imagePath={snapshot.imagePath} alt={alt} />;
  }

  return (
    <ComparisonView
      baselineImagePath={diff.baselineSnapshot.imagePath}
      baselineAlt={`baseline ${alt}`}
      newImagePath={snapshot.imagePath}
      newAlt={alt}
      diffImagePath={diff.diffImagePath}
    />
  );
};
