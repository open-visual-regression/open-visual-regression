import { getCookie } from "cookies-next/server";
import { cookies } from "next/headers";

import { SNAPSHOT_PREFERENCE_COOKIES, type SnapshotPreferences } from "./snapshotPreferences";

export const getSnapshotPreferences = async (): Promise<SnapshotPreferences> => {
  const [sidebarOpen, showDiff] = await Promise.all([
    getCookie(SNAPSHOT_PREFERENCE_COOKIES.sidebarOpen, { cookies }),
    getCookie(SNAPSHOT_PREFERENCE_COOKIES.showDiff, { cookies }),
  ]);

  return {
    sidebarOpen: sidebarOpen === "true",
    showDiff: showDiff !== "false",
  };
};
