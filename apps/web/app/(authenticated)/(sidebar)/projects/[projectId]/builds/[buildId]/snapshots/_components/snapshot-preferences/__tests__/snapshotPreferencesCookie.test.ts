import { describe, expect, it } from "@/test-utils";

import {
  DEFAULT_SNAPSHOT_PREFERENCES,
  getDocumentSnapshotPreferences,
  getSnapshotPreferences,
  setSnapshotPreferenceCookie,
} from "../snapshotPreferencesCookie";

const cookieStore = (values: Record<string, string>) => ({
  get: (name: string) => {
    const value = values[name];
    return value === undefined ? undefined : { value };
  },
});

describe("getSnapshotPreferences", () => {
  it("should fall back to the defaults when no cookies are set", () => {
    expect(getSnapshotPreferences(cookieStore({}))).toEqual(DEFAULT_SNAPSHOT_PREFERENCES);
  });

  it("should read the stored preferences", () => {
    expect(
      getSnapshotPreferences(
        cookieStore({ "ovr-snapshot-sidebar-open": "true", "ovr-snapshot-show-diff": "false" }),
      ),
    ).toEqual({ sidebarOpen: true, showDiff: false });
  });

  it("should ignore values that are not booleans", () => {
    expect(
      getSnapshotPreferences(
        cookieStore({ "ovr-snapshot-sidebar-open": "yes", "ovr-snapshot-show-diff": "" }),
      ),
    ).toEqual(DEFAULT_SNAPSHOT_PREFERENCES);
  });
});

describe("getDocumentSnapshotPreferences", () => {
  it("should fall back to the defaults when no cookies are set", () => {
    expect(getDocumentSnapshotPreferences()).toEqual(DEFAULT_SNAPSHOT_PREFERENCES);
  });

  it("should read back what setSnapshotPreferenceCookie stored", () => {
    setSnapshotPreferenceCookie("sidebarOpen", true);
    setSnapshotPreferenceCookie("showDiff", false);

    expect(getDocumentSnapshotPreferences()).toEqual({ sidebarOpen: true, showDiff: false });
  });
});
