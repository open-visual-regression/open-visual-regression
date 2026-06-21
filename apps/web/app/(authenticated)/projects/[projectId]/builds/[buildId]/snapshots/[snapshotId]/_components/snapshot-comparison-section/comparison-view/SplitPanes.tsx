import { BaselineSnapshotPane } from "./BaselineSnapshotPane";
import { NewSnapshotDiffPane } from "./NewSnapshotDiffPane";
import { NewSnapshotPane } from "./NewSnapshotPane";

export type SplitPanesProps = {
  baselineImagePath: string | null;
  baselineAlt: string;
  newImagePath: string | null;
  newAlt: string;
  diffImagePath: string | null;
};

export const SplitPanes = ({
  baselineImagePath,
  baselineAlt,
  newImagePath,
  newAlt,
  diffImagePath,
}: SplitPanesProps) => (
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <BaselineSnapshotPane imagePath={baselineImagePath} alt={baselineAlt} />
    {diffImagePath ? (
      <NewSnapshotDiffPane
        label="new"
        imagePath={newImagePath}
        diffImagePath={diffImagePath}
        alt={newAlt}
      />
    ) : (
      <NewSnapshotPane imagePath={newImagePath} alt={newAlt} />
    )}
  </div>
);
