"use client";

import { createContext, useContext, useState } from "react";

import {
  DEFAULT_SNAPSHOT_PREFERENCES,
  type SnapshotPreferences,
  type SnapshotSidebarTab,
} from "@/lib/preferences/snapshotPreferences";

type SnapshotPreferencesContextValue = {
  preferences: SnapshotPreferences;
  setPreference: <K extends keyof SnapshotPreferences>(
    key: K,
    value: SnapshotPreferences[K],
  ) => void;
};

const SnapshotPreferencesContext = createContext<SnapshotPreferencesContextValue | null>(null);

type SnapshotPreferencesProviderProps = {
  initialPreferences?: Partial<SnapshotPreferences>;
  children: React.ReactNode;
};

// Preferences live in memory only: they carry across client-side navigation within the
// app, but a hard page load starts again from the defaults.
export const SnapshotPreferencesProvider = ({
  initialPreferences,
  children,
}: SnapshotPreferencesProviderProps) => {
  const [preferences, setPreferences] = useState<SnapshotPreferences>(() => ({
    ...DEFAULT_SNAPSHOT_PREFERENCES,
    ...initialPreferences,
  }));

  const setPreference = <K extends keyof SnapshotPreferences>(
    key: K,
    value: SnapshotPreferences[K],
  ) => setPreferences((current) => ({ ...current, [key]: value }));

  return (
    <SnapshotPreferencesContext.Provider value={{ preferences, setPreference }}>
      {children}
    </SnapshotPreferencesContext.Provider>
  );
};

export const useSnapshotPreferences = () => {
  const context = useContext(SnapshotPreferencesContext);

  if (!context) {
    throw new Error("useSnapshotPreferences must be used within a SnapshotPreferencesProvider");
  }

  const { preferences, setPreference } = context;

  return {
    ...preferences,
    setSidebarOpen: (sidebarOpen: boolean) => setPreference("sidebarOpen", sidebarOpen),
    setSidebarTab: (sidebarTab: SnapshotSidebarTab) => setPreference("sidebarTab", sidebarTab),
    setShowDiff: (showDiff: boolean) => setPreference("showDiff", showDiff),
  };
};
