"use client";

import { useSnapshotPreferences } from "../../../_components/snapshot-preferences/snapshot-preferences";
import { SnapshotSidebar } from "../snapshot-sidebar/SnapshotSidebar";

// Reserves the sidebar's space while the page loads, so the content doesn't narrow once it renders.
export const SnapshotSidebarPlaceholder = () => {
  const { sidebarOpen } = useSnapshotPreferences();

  return sidebarOpen ? <SnapshotSidebar collapsed={false}>{null}</SnapshotSidebar> : null;
};
