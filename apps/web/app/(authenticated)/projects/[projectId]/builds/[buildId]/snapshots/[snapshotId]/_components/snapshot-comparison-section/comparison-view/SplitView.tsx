import { BaselineSnapshotPane } from "./BaselineSnapshotPane";
import { NewSnapshotDiffPane } from "./NewSnapshotDiffPane";
import { NewSnapshotPane } from "./NewSnapshotPane";

export type SplitViewProps = {
  baselineImagePath: string | null;
  baselineAlt: string;
  baselineCommitSha: string | null;
  baselineCommitUrl: string | null;
  newImagePath: string | null;
  newAlt: string;
  diffImagePath: string | null;
  showDiff: boolean;
};

export const SplitView = ({
  baselineImagePath,
  baselineAlt,
  baselineCommitSha,
  baselineCommitUrl,
  newImagePath,
  newAlt,
  diffImagePath,
  showDiff,
}: SplitViewProps) => (
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <BaselineSnapshotPane
      imagePath={baselineImagePath}
      alt={baselineAlt}
      fill={diffImagePath !== null}
      commitSha={baselineCommitSha}
      commitUrl={baselineCommitUrl}
    />
    {diffImagePath ? (
      <NewSnapshotDiffPane
        label="new"
        imagePath={newImagePath}
        diffImagePath={diffImagePath}
        alt={newAlt}
        showDiff={showDiff}
      />
    ) : (
      <NewSnapshotPane imagePath={newImagePath} alt={newAlt} />
    )}
  </div>
);
