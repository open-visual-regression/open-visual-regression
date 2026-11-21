import { DEFAULT_DIFF_SETTINGS } from "@ovr/api/contracts/settings";
import { dbClient } from "@ovr/db/client";

import { getDiffSettings, saveDiffSettings } from "../diffSettings";
import { describe, expect, test } from "./fixtures";

describe("diffSettings", () => {
  test("should return the defaults when no diff settings have been saved", async () => {
    expect(await getDiffSettings()).toEqual(DEFAULT_DIFF_SETTINGS);
  });

  test("should return the diff settings that were saved", async ({ reviewer }) => {
    await saveDiffSettings({ algorithm: "exact" }, reviewer.id);

    expect(await getDiffSettings()).toEqual({ algorithm: "exact" });
  });

  test("should fall back to the default algorithm when the stored one is unknown", async ({
    reviewer,
  }) => {
    await dbClient.settings.upsert({
      key: "diff",
      value: { algorithm: "fuzzy" },
      updatedBy: reviewer.id,
    });

    expect(await getDiffSettings()).toEqual(DEFAULT_DIFF_SETTINGS);
  });
});
