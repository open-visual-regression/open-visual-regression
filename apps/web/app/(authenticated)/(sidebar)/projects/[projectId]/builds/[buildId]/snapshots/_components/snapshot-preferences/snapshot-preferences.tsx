"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import {
  DEFAULT_SNAPSHOT_PREFERENCES,
  getDocumentSnapshotPreferences,
  setSnapshotPreferenceCookie,
  type SnapshotPreferences,
} from "./snapshotPreferencesCookie";

type SnapshotPreferencesContextValue = SnapshotPreferences & {
  setSidebarOpen: (sidebarOpen: boolean) => void;
  setShowDiff: (showDiff: boolean) => void;
};

const SnapshotPreferencesContext = createContext<SnapshotPreferencesContextValue | null>(null);

type SnapshotPreferencesProviderProps = {
  initialPreferences?: SnapshotPreferences;
  children: React.ReactNode;
};

/**
 * Holds the snapshot page preferences that survive navigation and reloads.
 *
 * The cookie is the only stored copy. The server reads it so the first paint is right; on the
 * client the cookie wins over `initialPreferences`, because a back/forward navigation can reuse a
 * cached server render that holds an older value. On hydration both read the same cookie.
 */
export const SnapshotPreferencesProvider = ({
  initialPreferences = DEFAULT_SNAPSHOT_PREFERENCES,
  children,
}: SnapshotPreferencesProviderProps) => {
  const [preferences, setPreferences] = useState<SnapshotPreferences>(() =>
    typeof document === "undefined" ? initialPreferences : getDocumentSnapshotPreferences(),
  );

  const setPreference = useCallback(
    <K extends keyof SnapshotPreferences>(key: K, value: SnapshotPreferences[K]) => {
      setPreferences((current) => ({ ...current, [key]: value }));
      setSnapshotPreferenceCookie(key, value);
    },
    [],
  );

  const value = useMemo(
    () => ({
      ...preferences,
      setSidebarOpen: (sidebarOpen: boolean) => setPreference("sidebarOpen", sidebarOpen),
      setShowDiff: (showDiff: boolean) => setPreference("showDiff", showDiff),
    }),
    [preferences, setPreference],
  );

  return (
    <SnapshotPreferencesContext.Provider value={value}>
      {children}
    </SnapshotPreferencesContext.Provider>
  );
};

export const useSnapshotPreferences = () => {
  const context = useContext(SnapshotPreferencesContext);

  if (!context) {
    throw new Error("useSnapshotPreferences must be used within a SnapshotPreferencesProvider");
  }

  return context;
};
