import { isTwoSided } from "../../snapshot-pane/diffImages";
import type {
  BaselineSnapshotPaneData,
  DiffImages,
  SnapshotPaneData,
} from "../../snapshot-pane/types";
import { BaselineSnapshotPane } from "./BaselineSnapshotPane";
import { NewSnapshotPane } from "./NewSnapshotPane";

export type SplitViewProps = {
  baseline: BaselineSnapshotPaneData;
  newSnapshot: SnapshotPaneData;
  diffImages: DiffImages;
  showDiff: boolean;
};

export const SplitView = ({ baseline, newSnapshot, diffImages, showDiff }: SplitViewProps) => {
  const canvasImagePaths = [baseline.imagePath, newSnapshot.imagePath];

  return (
    <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
      <BaselineSnapshotPane
        {...baseline}
        canvasImagePaths={canvasImagePaths}
        diffImagePath={diffImages.baseline}
        showDiff={showDiff}
        showDiffKey={isTwoSided(diffImages)}
      />
      <NewSnapshotPane
        {...newSnapshot}
        canvasImagePaths={canvasImagePaths}
        diffImagePath={diffImages.newSnapshot}
        showDiff={showDiff}
        showDiffKey={isTwoSided(diffImages)}
      />
    </div>
  );
};
