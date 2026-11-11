import { getCookie } from "cookies-next/server";
import { cookies } from "next/headers";

import {
  isSnapshotSidebarTab,
  SNAPSHOT_PREFERENCE_COOKIES,
  type SnapshotPreferences,
} from "./snapshotPreferences";

export const getSnapshotPreferences = async (): Promise<SnapshotPreferences> => {
  const [sidebarOpen, sidebarTab, showDiff] = await Promise.all([
    getCookie(SNAPSHOT_PREFERENCE_COOKIES.sidebarOpen, { cookies }),
    getCookie(SNAPSHOT_PREFERENCE_COOKIES.sidebarTab, { cookies }),
    getCookie(SNAPSHOT_PREFERENCE_COOKIES.showDiff, { cookies }),
  ]);

  return {
    sidebarOpen: sidebarOpen === "true",
    sidebarTab: isSnapshotSidebarTab(sidebarTab) ? sidebarTab : "reviews",
    showDiff: showDiff !== "false",
  };
};
