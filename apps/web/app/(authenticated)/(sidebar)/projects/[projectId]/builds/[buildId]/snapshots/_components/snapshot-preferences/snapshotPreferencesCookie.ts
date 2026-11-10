export type SnapshotPreferences = {
  sidebarOpen: boolean;
  showDiff: boolean;
};

export const DEFAULT_SNAPSHOT_PREFERENCES: SnapshotPreferences = {
  sidebarOpen: false,
  showDiff: true,
};

const COOKIE_NAMES = {
  sidebarOpen: "ovr-snapshot-sidebar-open",
  showDiff: "ovr-snapshot-show-diff",
} as const satisfies Record<keyof SnapshotPreferences, string>;

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

type CookieReader = (name: string) => string | undefined;

const parseBoolean = (value: string | undefined, fallback: boolean) =>
  value === "true" ? true : value === "false" ? false : fallback;

const readSnapshotPreferences = (read: CookieReader): SnapshotPreferences => ({
  sidebarOpen: parseBoolean(
    read(COOKIE_NAMES.sidebarOpen),
    DEFAULT_SNAPSHOT_PREFERENCES.sidebarOpen,
  ),
  showDiff: parseBoolean(read(COOKIE_NAMES.showDiff), DEFAULT_SNAPSHOT_PREFERENCES.showDiff),
});

type CookieStore = {
  get: (name: string) => { value: string } | undefined;
};

/** Server: reads the preferences from the request cookies. */
export const getSnapshotPreferences = (cookieStore: CookieStore): SnapshotPreferences =>
  readSnapshotPreferences((name) => cookieStore.get(name)?.value);

/** Client: reads the preferences from `document.cookie`. */
export const getDocumentSnapshotPreferences = (): SnapshotPreferences => {
  const cookies = new Map(
    document.cookie
      .split("; ")
      .filter(Boolean)
      .map((cookie) => {
        const separator = cookie.indexOf("=");
        return [cookie.slice(0, separator), cookie.slice(separator + 1)] as const;
      }),
  );

  return readSnapshotPreferences((name) => cookies.get(name));
};

/** Client: stores one preference in its cookie. */
export const setSnapshotPreferenceCookie = <K extends keyof SnapshotPreferences>(
  key: K,
  value: SnapshotPreferences[K],
) => {
  document.cookie = `${COOKIE_NAMES[key]}=${value}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
};
