export type SnapshotPaneData = {
  imagePath: string | null;
  alt: string;
};

export type BaselineSnapshotPaneData = SnapshotPaneData & {
  commitSha: string | null;
  commitUrl: string | null;
};

export type SnapshotSize = {
  width: number;
  height: number;
};

/**
 * Diff overlays, one for each image: what was removed or changed tinted red on
 * the baseline, what was added or changed tinted green on the new snapshot.
 */
export type DiffImages = {
  baseline: string | null;
  newSnapshot: string | null;
};
