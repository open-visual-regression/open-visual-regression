import type { BaselineSnapshotPaneData, SnapshotPaneData } from "../../snapshot-pane/types";
import { BaselineSnapshotPane } from "./BaselineSnapshotPane";
import { NewSnapshotDiffPane } from "./NewSnapshotDiffPane";
import { NewSnapshotPane } from "./NewSnapshotPane";

export type SplitViewProps = {
  baseline: BaselineSnapshotPaneData;
  newSnapshot: SnapshotPaneData;
  diffImagePath: string | null;
  showDiff: boolean;
};

export const SplitView = ({ baseline, newSnapshot, diffImagePath, showDiff }: SplitViewProps) => (
  <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)]">
    <BaselineSnapshotPane {...baseline} fill={diffImagePath !== null} />
    {diffImagePath ? (
      <NewSnapshotDiffPane
        {...newSnapshot}
        label="new"
        diffImagePath={diffImagePath}
        showDiff={showDiff}
      />
    ) : (
      <NewSnapshotPane {...newSnapshot} />
    )}
  </div>
);
