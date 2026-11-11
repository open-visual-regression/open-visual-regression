export const SNAPSHOT_SIDEBAR_TABS = ["reviews", "logs", "history"] as const;

export type SnapshotSidebarTab = (typeof SNAPSHOT_SIDEBAR_TABS)[number];

export const isSnapshotSidebarTab = (value: unknown): value is SnapshotSidebarTab =>
  SNAPSHOT_SIDEBAR_TABS.includes(value as SnapshotSidebarTab);

export type SnapshotPreferences = {
  sidebarOpen: boolean;
  sidebarTab: SnapshotSidebarTab;
  showDiff: boolean;
};

export const SNAPSHOT_PREFERENCE_COOKIES = {
  sidebarOpen: "ovr-snapshot-sidebar-open",
  sidebarTab: "ovr-snapshot-sidebar-tab",
  showDiff: "ovr-snapshot-show-diff",
} as const satisfies Record<keyof SnapshotPreferences, string>;

export const SNAPSHOT_PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
