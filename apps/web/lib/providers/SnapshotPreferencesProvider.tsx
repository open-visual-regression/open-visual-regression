"use client";

import { setCookie } from "cookies-next/client";
import { createContext, use, useContext, useState } from "react";

import {
  SNAPSHOT_PREFERENCE_COOKIE_MAX_AGE,
  SNAPSHOT_PREFERENCE_COOKIES,
  type SnapshotPreferences,
  type SnapshotSidebarTab,
} from "@/lib/preferences/snapshotPreferences";

type SnapshotPreferencesContextValue = {
  initialPreferences: SnapshotPreferences | Promise<SnapshotPreferences>;
  changes: Partial<SnapshotPreferences>;
  setPreference: <K extends keyof SnapshotPreferences>(
    key: K,
    value: SnapshotPreferences[K],
  ) => void;
};

const SnapshotPreferencesContext = createContext<SnapshotPreferencesContextValue | null>(null);

const savePreference = <K extends keyof SnapshotPreferences>(
  key: K,
  value: SnapshotPreferences[K],
) =>
  setCookie(SNAPSHOT_PREFERENCE_COOKIES[key], value, {
    path: "/",
    maxAge: SNAPSHOT_PREFERENCE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

type SnapshotPreferencesProviderProps = {
  // A promise lets the layout pass the saved preferences without waiting on cookies,
  // so prerendered page shells aren't held up. Readers suspend until it resolves.
  initialPreferences: SnapshotPreferences | Promise<SnapshotPreferences>;
  children: React.ReactNode;
};

export const SnapshotPreferencesProvider = ({
  initialPreferences,
  children,
}: SnapshotPreferencesProviderProps) => {
  const [changes, setChanges] = useState<Partial<SnapshotPreferences>>({});

  const setPreference = <K extends keyof SnapshotPreferences>(
    key: K,
    value: SnapshotPreferences[K],
  ) => {
    setChanges((current) => ({ ...current, [key]: value }));
    savePreference(key, value);
  };

  return (
    <SnapshotPreferencesContext.Provider value={{ initialPreferences, changes, setPreference }}>
      {children}
    </SnapshotPreferencesContext.Provider>
  );
};

export const useSnapshotPreferences = () => {
  const context = useContext(SnapshotPreferencesContext);

  if (!context) {
    throw new Error("useSnapshotPreferences must be used within a SnapshotPreferencesProvider");
  }

  const { initialPreferences, changes, setPreference } = context;
  const saved =
    initialPreferences instanceof Promise ? use(initialPreferences) : initialPreferences;

  return {
    ...saved,
    ...changes,
    setSidebarOpen: (sidebarOpen: boolean) => setPreference("sidebarOpen", sidebarOpen),
    setSidebarTab: (sidebarTab: SnapshotSidebarTab) => setPreference("sidebarTab", sidebarTab),
    setShowDiff: (showDiff: boolean) => setPreference("showDiff", showDiff),
  };
};
