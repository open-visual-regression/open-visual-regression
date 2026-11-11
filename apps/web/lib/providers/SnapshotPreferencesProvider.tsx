"use client";

import { setCookie } from "cookies-next/client";
import { createContext, useContext, useState } from "react";

import {
  SNAPSHOT_PREFERENCE_COOKIE_MAX_AGE,
  SNAPSHOT_PREFERENCE_COOKIES,
  type SnapshotPreferences,
} from "@/lib/preferences/snapshotPreferences";

type SnapshotPreferencesContextValue = SnapshotPreferences & {
  setSidebarOpen: (sidebarOpen: boolean) => void;
  setShowDiff: (showDiff: boolean) => void;
};

const SnapshotPreferencesContext = createContext<SnapshotPreferencesContextValue | null>(null);

const savePreference = (key: keyof SnapshotPreferences, value: boolean) =>
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
  const [showDiff, setShowDiffState] = useState(initialPreferences.showDiff);

  const setSidebarOpen = (open: boolean) => {
    setSidebarOpenState(open);
    savePreference("sidebarOpen", open);
  };

  const setShowDiff = (show: boolean) => {
    setShowDiffState(show);
    savePreference("showDiff", show);
  };

  return (
    <SnapshotPreferencesContext.Provider
      value={{ sidebarOpen, showDiff, setSidebarOpen, setShowDiff }}
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
