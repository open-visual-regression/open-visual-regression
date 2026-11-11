"use client";

import { setCookie } from "cookies-next/client";
import { createContext, useContext, useState } from "react";

import {
  SNAPSHOT_PREFERENCE_COOKIE_MAX_AGE,
  SNAPSHOT_PREFERENCE_COOKIES,
  type SnapshotPreferences,
  type SnapshotSidebarTab,
} from "@/lib/preferences/snapshotPreferences";

type SnapshotPreferencesContextValue = SnapshotPreferences & {
  setSidebarOpen: (sidebarOpen: boolean) => void;
  setSidebarTab: (sidebarTab: SnapshotSidebarTab) => void;
  setShowDiff: (showDiff: boolean) => void;
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
  initialPreferences: SnapshotPreferences;
  children: React.ReactNode;
};

export const SnapshotPreferencesProvider = ({
  initialPreferences,
  children,
}: SnapshotPreferencesProviderProps) => {
  const [sidebarOpen, setSidebarOpenState] = useState(initialPreferences.sidebarOpen);
  const [sidebarTab, setSidebarTabState] = useState(initialPreferences.sidebarTab);
  const [showDiff, setShowDiffState] = useState(initialPreferences.showDiff);

  const setSidebarOpen = (open: boolean) => {
    setSidebarOpenState(open);
    savePreference("sidebarOpen", open);
  };

  const setSidebarTab = (tab: SnapshotSidebarTab) => {
    setSidebarTabState(tab);
    savePreference("sidebarTab", tab);
  };

  const setShowDiff = (show: boolean) => {
    setShowDiffState(show);
    savePreference("showDiff", show);
  };

  return (
    <SnapshotPreferencesContext.Provider
      value={{ sidebarOpen, sidebarTab, showDiff, setSidebarOpen, setSidebarTab, setShowDiff }}
    >
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
