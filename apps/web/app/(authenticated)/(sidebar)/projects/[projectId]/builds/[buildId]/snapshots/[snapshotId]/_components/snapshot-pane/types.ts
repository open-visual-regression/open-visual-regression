export type SnapshotPaneData = {
  imagePath: string | null;
  alt: string;
};

export type BaselineSnapshotPaneData = SnapshotPaneData & {
  commitSha: string | null;
  commitUrl: string | null;
};
