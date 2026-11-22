import { DEFAULT_DIFF_SETTINGS } from "@ovr/api/contracts/settings";
import { dbClient } from "@ovr/db/client";

import { getDiffSettings, saveDiffSettings } from "../diffSettings";
import { describe, expect, test } from "./fixtures";

describe("diffSettings", () => {
  test("should return the defaults when no diff settings have been saved", async () => {
    expect(await getDiffSettings()).toEqual(DEFAULT_DIFF_SETTINGS);
  });

  test("should return the diff settings that were saved", async ({ user }) => {
    await saveDiffSettings({ highlight: "exact" }, user.id);

    expect(await getDiffSettings()).toEqual({ highlight: "exact" });
  });

  test("should fall back to the default highlight when the stored one is unknown", async ({
    user,
  }) => {
    await dbClient.settings.upsert({
      key: "diff_images",
      value: { highlight: "fuzzy" },
      updatedBy: user.id,
    });

    expect(await getDiffSettings()).toEqual(DEFAULT_DIFF_SETTINGS);
  });
});
