import { cn } from "@ovr/ui/lib/utils";

import { FIT_WIDTH_TWO_UP_CLASS } from "../../snapshot-pane/snapshot-fit";
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
  <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-2", FIT_WIDTH_TWO_UP_CLASS)}>
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
