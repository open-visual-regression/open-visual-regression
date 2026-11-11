export type SnapshotPreferences = {
  sidebarOpen: boolean;
  showDiff: boolean;
};

export const SNAPSHOT_PREFERENCE_COOKIES = {
  sidebarOpen: "ovr-snapshot-sidebar-open",
  showDiff: "ovr-snapshot-show-diff",
} as const satisfies Record<keyof SnapshotPreferences, string>;

export const SNAPSHOT_PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
