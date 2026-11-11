"use client";

import { Tabs } from "@ovr/ui/components/tabs";

import { isSnapshotSidebarTab } from "@/lib/preferences/snapshotPreferences";
import { useSnapshotPreferences } from "@/lib/providers/SnapshotPreferencesProvider";

type SnapshotSidebarTabsProps = {
  children: React.ReactNode;
};

export const SnapshotSidebarTabs = ({ children }: SnapshotSidebarTabsProps) => {
  const { sidebarTab, setSidebarTab } = useSnapshotPreferences();

  return (
    <Tabs
      value={sidebarTab}
      onValueChange={(value) => {
        if (isSnapshotSidebarTab(value)) {
          setSidebarTab(value);
        }
      }}
      className="gap-0"
    >
      {children}
    </Tabs>
  );
};
