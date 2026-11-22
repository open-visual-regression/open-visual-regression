import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

describe("settings", () => {
  describe("find", () => {
    test("should return undefined for a setting that has never been saved", async () => {
      expect(await dbClient.settings.find("flaky_detection")).toBeUndefined();
    });
  });

  describe("upsert", () => {
    test("should store a setting and who saved it", async ({ user }) => {
      await dbClient.settings.upsert({
        key: "flaky_detection",
        value: { enabled: true, cron: "0 */6 * * *" },
        updatedBy: user.id,
      });

      expect(await dbClient.settings.find("flaky_detection")).toMatchObject({
        key: "flaky_detection",
        value: { enabled: true, cron: "0 */6 * * *" },
        updatedBy: user.id,
      });
    });

    test("should replace a setting when it is saved again", async ({ user }) => {
      await dbClient.settings.upsert({
        key: "flaky_detection",
        value: { enabled: true, cron: "0 */6 * * *" },
        updatedBy: user.id,
      });

      await dbClient.settings.upsert({
        key: "flaky_detection",
        value: { enabled: false },
        updatedBy: user.id,
      });

      expect((await dbClient.settings.find("flaky_detection"))?.value).toEqual({ enabled: false });
    });
  });
});
