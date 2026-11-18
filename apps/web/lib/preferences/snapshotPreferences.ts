export const SNAPSHOT_SIDEBAR_TABS = ["reviews", "logs", "history"] as const;

export type SnapshotSidebarTab = (typeof SNAPSHOT_SIDEBAR_TABS)[number];

export const isSnapshotSidebarTab = (value: unknown): value is SnapshotSidebarTab =>
  SNAPSHOT_SIDEBAR_TABS.includes(value as SnapshotSidebarTab);

export type SnapshotPreferences = {
  sidebarOpen: boolean;
  sidebarTab: SnapshotSidebarTab;
  showDiff: boolean;
};

export const DEFAULT_SNAPSHOT_PREFERENCES: SnapshotPreferences = {
  sidebarOpen: false,
  sidebarTab: "reviews",
  showDiff: true,
};
